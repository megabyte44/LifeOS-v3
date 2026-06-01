param(
    [ValidateSet("canary", "stable", "rollback")]
    [string]$Mode = "canary"
)

$ErrorActionPreference = "Stop"

function Get-EnvValueFromFile {
    param(
        [string]$FilePath,
        [string]$Key
    )

    if (-not (Test-Path $FilePath)) {
        return $null
    }

    $escapedKey = [regex]::Escape($Key)
    $pattern = "^\s*${escapedKey}\s*=\s*(.*)\s*$"
    foreach ($line in Get-Content -Path $FilePath) {
        if ($line -match "^\s*#") {
            continue
        }
        if ($line -match $pattern) {
            return $Matches[1].Trim()
        }
    }

    return $null
}

function Get-EnvOrFileValue {
    param(
        [string]$Key,
        [string]$EnvFilePath,
        [string]$Default = $null
    )

    $value = $env:$Key
    if ([string]::IsNullOrWhiteSpace($value)) {
        $value = Get-EnvValueFromFile -FilePath $EnvFilePath -Key $Key
    }

    if ([string]::IsNullOrWhiteSpace($value)) {
        return $Default
    }

    return $value
}

$envFilePath = Join-Path $PSScriptRoot ".env"
$rdsHost = Get-EnvOrFileValue -Key "RDSHOST" -EnvFilePath $envFilePath
if (-not [string]::IsNullOrWhiteSpace($rdsHost)) {
    $rdsPort = Get-EnvOrFileValue -Key "RDS_PORT" -EnvFilePath $envFilePath -Default "5432"
    $rdsUser = Get-EnvOrFileValue -Key "RDS_USERNAME" -EnvFilePath $envFilePath -Default "postgres"
    $awsRegion = Get-EnvOrFileValue -Key "AWS_REGION" -EnvFilePath $envFilePath -Default "us-east-1"

    if ([string]::IsNullOrWhiteSpace($env:SPRING_DATASOURCE_USERNAME) -and -not [string]::IsNullOrWhiteSpace($rdsUser)) {
        $env:SPRING_DATASOURCE_USERNAME = $rdsUser
    }

    if ([string]::IsNullOrWhiteSpace($env:SPRING_DATASOURCE_PASSWORD)) {
        $awsCmd = Get-Command aws -ErrorAction SilentlyContinue
        if ($awsCmd) {
            $token = & aws rds generate-db-auth-token --hostname $rdsHost --port $rdsPort --username $rdsUser --region $awsRegion
            if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($token)) {
                $env:SPRING_DATASOURCE_PASSWORD = $token.Trim()
                Write-Host "AWS RDS IAM token set for this session."
            } else {
                Write-Warning "AWS CLI could not generate an IAM token. Set SPRING_DATASOURCE_PASSWORD manually if needed."
            }
        } else {
            Write-Warning "AWS CLI not found; cannot generate IAM token. Set SPRING_DATASOURCE_PASSWORD manually if needed."
        }
    }
}

$jarPath = Join-Path $PSScriptRoot "target\backend-0.0.1-SNAPSHOT.jar"
if (-not (Test-Path $jarPath)) {
    Write-Error "Jar not found at $jarPath. Build first with: .\mvnw.cmd -DskipTests package"
}

switch ($Mode) {
    "canary" {
        $jvmArgs = @("-Xms128m", "-Xmx384m", "-XX:+UseG1GC")
    }
    "stable" {
        $jvmArgs = @("-Xms192m", "-Xmx512m", "-XX:+UseG1GC")
    }
    "rollback" {
        $jvmArgs = @("-Xms256m", "-Xmx768m", "-XX:+UseG1GC")
    }
}

Write-Host "Starting backend in '$Mode' mode with JVM args: $($jvmArgs -join ' ')"
& java @jvmArgs -jar $jarPath
