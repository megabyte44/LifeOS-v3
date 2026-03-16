param(
    [ValidateSet("canary", "stable", "rollback")]
    [string]$Mode = "canary"
)

$ErrorActionPreference = "Stop"

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
