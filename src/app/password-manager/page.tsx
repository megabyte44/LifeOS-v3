
'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Credential } from '@/types';
import { P_PASSWORDS } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { KeySquare, Loader2, ShieldCheck, Landmark, Globe, Users, PlusSquare, Eye, EyeOff, Copy, Trash2, Edit, Save, Search, CheckCircle2, Lock, ExternalLink, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';


function SensitiveInput({ id, fieldName, value, onToggle, onCopy, isVisible, isCopied }: { id: string; fieldName: string; value: string | number; onToggle: (id: string, fieldName: string) => void; onCopy: (value: string | number, fieldName: string, credId: string) => void; isVisible: boolean; isCopied: boolean; }) {
  return (
    <div className="flex items-center gap-1">
      <Input type={isVisible ? 'text' : 'password'} value={isVisible ? String(value) : '••••••••••'} readOnly className="text-xs bg-muted/50 h-8 px-2" />
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onToggle(id, fieldName)}>
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
      <Button 
        variant={isCopied ? "default" : "ghost"} 
        size="icon" 
        className="h-8 w-8 shrink-0" 
        onClick={() => onCopy(value, fieldName, id)}
      >
        {isCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function CredentialDialog({ isOpen, onOpenChange, onSave, credential }: { isOpen: boolean; onOpenChange: (open: boolean) => void; onSave: (data: Omit<Credential, 'id' | 'lastUpdated'>, id?: string) => void; credential: Credential | null; }) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<'Website' | 'Banking' | 'Social Media' | 'Other'>('Website');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [website, setWebsite] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [upiPin, setUpiPin] = useState('');
    const [netbankingId, setNetbankingId] = useState('');
    const [mpin, setMpin] = useState('');
    const [netbankingPassword, setNetbankingPassword] = useState('');
    const [transactionPassword, setTransactionPassword] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (credential) {
                setName(credential.name); setCategory(credential.category); setUsername(credential.username || ''); setPassword(credential.password || ''); setWebsite(credential.website || ''); setAccountNumber(String(credential.accountNumber || '')); setIfscCode(credential.ifscCode || ''); setUpiPin(String(credential.upiPin || '')); setNetbankingId(credential.netbankingId || ''); setMpin(String(credential.mpin || '')); setNetbankingPassword(credential.netbankingPassword || ''); setTransactionPassword(credential.transactionPassword || '');
            } else {
                setName(''); setCategory('Website'); setUsername(''); setPassword(''); setWebsite(''); setAccountNumber(''); setIfscCode(''); setUpiPin(''); setNetbankingId(''); setMpin(''); setNetbankingPassword(''); setTransactionPassword('');
            }
        }
    }, [credential, isOpen]);
    
    const handleSaveClick = () => {
        if (!name) return;
        const credData: Omit<Credential, 'id' | 'lastUpdated'> = { name, category, ...(category === 'Banking' ? { accountNumber, ifscCode, upiPin, netbankingId, mpin, netbankingPassword, transactionPassword } : { username, password, website }) };
        onSave(credData, credential?.id);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] p-3">
                <DialogHeader className="p-2 pb-0"><DialogTitle>{credential ? 'Edit Credential' : 'Add New Credential'}</DialogTitle><DialogDescription>{credential ? `Updating details for ${credential.name}.` : 'Fill in the details for the new credential.'}</DialogDescription></DialogHeader>
                <div className="space-y-2 py-1 px-2">
                     <div className="grid grid-cols-2 gap-1">
                        <div><Label htmlFor="newAccountName" className="text-xs">Account Name</Label><Input id="newAccountName" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Netflix" className="h-8" /></div>
                        <div>
                            <Label htmlFor="newAccountCategory" className="text-xs">Category</Label>
                            <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                                <SelectTrigger id="newAccountCategory" className="h-8"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="Website">Website</SelectItem><SelectItem value="Banking">Banking</SelectItem><SelectItem value="Social Media">Social Media</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                            </Select>
                        </div>
                    </div>
                    {category === 'Banking' ? (
                        <div className="border-t pt-2 mt-2 space-y-1">
                            <h3 className="text-sm font-semibold flex items-center gap-2"><Landmark className="h-4 w-4 text-primary" /> Banking Details</h3>
                             <ScrollArea className="h-56 rounded-md border p-2">
                                <div className="space-y-2 pr-2">
                                    <div><Label htmlFor="accNum" className="text-xs">Account Number</Label><Input id="accNum" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="h-8" /></div>
                                    <div><Label htmlFor="ifsc" className="text-xs">IFSC Code</Label><Input id="ifsc" value={ifscCode} onChange={e => setIfscCode(e.target.value)} className="h-8" /></div>
                                    <div><Label htmlFor="upi" className="text-xs">UPI PIN</Label><Input type="password" id="upi" value={upiPin} onChange={e => setUpiPin(e.target.value)} className="h-8" /></div>
                                    <div><Label htmlFor="nbid" className="text-xs">Netbanking ID</Label><Input id="nbid" value={netbankingId} onChange={e => setNetbankingId(e.target.value)} className="h-8" /></div>
                                    <div><Label htmlFor="mpin" className="text-xs">MPIN</Label><Input type="password" id="mpin" value={mpin} onChange={e => setMpin(e.target.value)} className="h-8" /></div>
                                    <div><Label htmlFor="nbpass" className="text-xs">Netbanking Password</Label><Input type="password" id="nbpass" value={netbankingPassword} onChange={e => setNetbankingPassword(e.target.value)} className="h-8" /></div>
                                    <div><Label htmlFor="txpass" className="text-xs">Transaction Password</Label><Input type="password" id="txpass" value={transactionPassword} onChange={e => setTransactionPassword(e.target.value)} className="h-8" /></div>
                                </div>
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div><Label htmlFor="username" className="text-xs">Username / Email</Label><Input id="username" value={username} onChange={e => setUsername(e.target.value)} className="h-8" /></div>
                            <div><Label htmlFor="password" className="text-xs">Password</Label><Input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className="h-8" /></div>
                            {category === 'Website' && <div><Label htmlFor="website" className="text-xs">Website URL</Label><Input id="website" value={website} onChange={e => setWebsite(e.target.value)} className="h-8" /></div>}
                        </div>
                    )}
                </div>
                <DialogFooter className="p-2 pt-0"><Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button><Button size="sm" onClick={handleSaveClick}><Save className="mr-1 h-3.5 w-3.5" /> Save</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function PasswordManagerPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [visibilities, setVisibilities] = useState<Record<string, Record<string, boolean>>>({});
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    // Mock data loading
    setTimeout(() => {
        setCredentials(P_PASSWORDS);
        setIsLoading(false);
    }, 500);
  }, [user]);
  
  const saveCredentials = async (updatedCredentials: Credential[]) => {
    if (!user) return;
    console.log('Saving credentials:', updatedCredentials);
  };

  const handleSaveCredential = (data: Omit<Credential, 'id' | 'lastUpdated'>, id?: string) => {
    let updatedCredentials;
    if (id) {
      updatedCredentials = credentials.map(c => c.id === id ? { ...c, ...data, lastUpdated: new Date().toISOString().split('T')[0] } : c);
    } else {
      const newCredential: Credential = { id: `cred-${Date.now()}`, ...data, lastUpdated: new Date().toISOString().split('T')[0] };
      updatedCredentials = [newCredential, ...credentials];
    }
    setCredentials(updatedCredentials);
    saveCredentials(updatedCredentials);
    setIsFormOpen(false);
    setEditingCredential(null);
  };
  
  const handleDeleteCredential = (id: string) => {
    const updatedCredentials = credentials.filter(c => c.id !== id);
    setCredentials(updatedCredentials);
    saveCredentials(updatedCredentials);
  };

  const handleToggleVisibility = (id: string, fieldName: string) => {
    setVisibilities(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [fieldName]: !prev[id]?.[fieldName] } }));
  };

  const toggleCardExpansion = (id: string) => {
    setExpandedCardIds(prev => { const newSet = new Set(prev); newSet.has(id) ? newSet.delete(id) : newSet.add(id); return newSet; });
  };

  const handleCopy = (text: string | number, fieldName: string, credId: string) => {
    if (text === undefined || text === null || String(text).trim() === '') return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(`${credId}-${fieldName}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredCredentials = useMemo(() => {
    return credentials.filter(cred => {
      const matchesSearch = searchQuery === '' || 
        cred.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cred.website?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = activeCategory === 'all' || cred.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [credentials, searchQuery, activeCategory]);

  const groupedCredentials = useMemo(() => {
    return filteredCredentials.reduce((acc, cred) => {
      if (cred && cred.category) (acc[cred.category] = acc[cred.category] || []).push(cred);
      return acc;
    }, {} as Record<string, Credential[]>);
  }, [filteredCredentials]);

  const stats = useMemo(() => ({
    total: credentials.length,
    banking: credentials.filter(c => c.category === 'Banking').length,
    websites: credentials.filter(c => c.category === 'Website').length,
    social: credentials.filter(c => c.category === 'Social Media').length,
    other: credentials.filter(c => c.category === 'Other').length,
  }), [credentials]);

  const categoryIcons: Record<string, React.ElementType> = { 'Banking': Landmark, 'Website': Globe, 'Social Media': Users, 'Other': KeySquare };
  const categoryColors: Record<string, string> = { 
    'Banking': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', 
    'Website': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', 
    'Social Media': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300', 
    'Other': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' 
  };
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading Vault...</p></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header with Search */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
                <ShieldCheck className="h-7 w-7 text-primary" />
                Password Vault
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Securely manage {stats.total} credential{stats.total !== 1 ? 's' : ''}</p>
            </div>
            <Button onClick={() => { setEditingCredential(null); setIsFormOpen(true); }}>
              <PlusSquare className="mr-2 h-4 w-4" /> Add New
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search credentials by name, username, or website..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={activeCategory === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveCategory('all')}
            >
              All ({stats.total})
            </Button>
            <Button 
              variant={activeCategory === 'Banking' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveCategory('Banking')}
            >
              <Landmark className="mr-1 h-3.5 w-3.5" /> Banking ({stats.banking})
            </Button>
            <Button 
              variant={activeCategory === 'Website' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveCategory('Website')}
            >
              <Globe className="mr-1 h-3.5 w-3.5" /> Websites ({stats.websites})
            </Button>
            <Button 
              variant={activeCategory === 'Social Media' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveCategory('Social Media')}
            >
              <Users className="mr-1 h-3.5 w-3.5" /> Social ({stats.social})
            </Button>
            <Button 
              variant={activeCategory === 'Other' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveCategory('Other')}
            >
              <KeySquare className="mr-1 h-3.5 w-3.5" /> Other ({stats.other})
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {filteredCredentials.length === 0 && (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-6">
                  <Lock className="h-12 w-12 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {searchQuery || activeCategory !== 'all' ? 'No credentials found' : 'No credentials yet'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || activeCategory !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Add your first credential to get started'}
                </p>
              </div>
              {!searchQuery && activeCategory === 'all' && (
                <Button onClick={() => { setEditingCredential(null); setIsFormOpen(true); }}>
                  <PlusSquare className="mr-2 h-4 w-4" /> Add First Credential
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Credentials Grid */}
        {filteredCredentials.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCredentials.map(cred => {
              const isExpanded = expandedCardIds.has(cred.id);
              const Icon = categoryIcons[cred.category] || KeySquare;
              const colorClass = categoryColors[cred.category] || categoryColors['Other'];

              return (
                <Card key={cred.id} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={cn("rounded-lg p-2 shrink-0", colorClass)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{cred.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {cred.category === 'Banking' 
                              ? cred.accountNumber ? `••••${String(cred.accountNumber).slice(-4)}` : 'Banking Account'
                              : cred.username || 'No username'}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {cred.category}
                      </Badge>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-3 flex-grow p-4 pt-0">
                      {cred.category === 'Banking' ? (
                        <>
                          {cred.accountNumber && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Account Number</Label>
                              <p className="text-sm font-mono mt-1">{cred.accountNumber}</p>
                            </div>
                          )}
                          {cred.ifscCode && (
                            <div>
                              <Label className="text-xs text-muted-foreground">IFSC Code</Label>
                              <p className="text-sm font-mono mt-1">{cred.ifscCode}</p>
                            </div>
                          )}
                          {cred.netbankingId && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Netbanking ID</Label>
                              <p className="text-sm mt-1">{cred.netbankingId}</p>
                            </div>
                          )}
                          {cred.upiPin && (
                            <div>
                              <Label className="text-xs text-muted-foreground">UPI PIN</Label>
                              <SensitiveInput 
                                id={cred.id} 
                                fieldName="upiPin" 
                                value={cred.upiPin} 
                                isVisible={!!visibilities[cred.id]?.upiPin} 
                                onToggle={handleToggleVisibility} 
                                onCopy={handleCopy}
                                isCopied={copiedField === `${cred.id}-upiPin`}
                              />
                            </div>
                          )}
                          {cred.mpin && (
                            <div>
                              <Label className="text-xs text-muted-foreground">MPIN</Label>
                              <SensitiveInput 
                                id={cred.id} 
                                fieldName="mpin" 
                                value={cred.mpin} 
                                isVisible={!!visibilities[cred.id]?.mpin} 
                                onToggle={handleToggleVisibility} 
                                onCopy={handleCopy}
                                isCopied={copiedField === `${cred.id}-mpin`}
                              />
                            </div>
                          )}
                          {cred.netbankingPassword && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Netbanking Password</Label>
                              <SensitiveInput 
                                id={cred.id} 
                                fieldName="netbankingPassword" 
                                value={cred.netbankingPassword} 
                                isVisible={!!visibilities[cred.id]?.netbankingPassword} 
                                onToggle={handleToggleVisibility} 
                                onCopy={handleCopy}
                                isCopied={copiedField === `${cred.id}-netbankingPassword`}
                              />
                            </div>
                          )}
                          {cred.transactionPassword && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Transaction Password</Label>
                              <SensitiveInput 
                                id={cred.id} 
                                fieldName="transactionPassword" 
                                value={cred.transactionPassword} 
                                isVisible={!!visibilities[cred.id]?.transactionPassword} 
                                onToggle={handleToggleVisibility} 
                                onCopy={handleCopy}
                                isCopied={copiedField === `${cred.id}-transactionPassword`}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {cred.username && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Username / Email</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm flex-1 truncate">{cred.username}</p>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 shrink-0"
                                  onClick={() => handleCopy(cred.username!, 'username', cred.id)}
                                >
                                  {copiedField === `${cred.id}-username` ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          )}
                          {cred.website && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Website</Label>
                              <a 
                                href={cred.website.startsWith('http') ? cred.website : `https://${cred.website}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                              >
                                <span className="truncate">{cred.website}</span>
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            </div>
                          )}
                          {cred.password && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Password</Label>
                              <SensitiveInput 
                                id={cred.id} 
                                fieldName="password" 
                                value={cred.password} 
                                isVisible={!!visibilities[cred.id]?.password} 
                                onToggle={handleToggleVisibility} 
                                onCopy={handleCopy}
                                isCopied={copiedField === `${cred.id}-password`}
                              />
                            </div>
                          )}
                        </>
                      )}
                      <div className="pt-2 border-t">
                        <p className="text-[10px] text-muted-foreground">Last updated: {cred.lastUpdated}</p>
                      </div>
                    </CardContent>
                  )}

                  <CardFooter className="p-4 pt-2 flex gap-2 mt-auto">
                    {isExpanded && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => { setEditingCredential(cred); setIsFormOpen(true); }}
                          className="flex-1"
                        >
                          <Edit className="mr-1 h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteCredential(cred.id)}
                          className="flex-1"
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                        </Button>
                      </>
                    )}
                    <Button 
                      variant={isExpanded ? "secondary" : "default"}
                      size="sm" 
                      onClick={() => toggleCardExpansion(cred.id)}
                      className={isExpanded ? "" : "w-full"}
                    >
                      {isExpanded ? <EyeOff className="mr-1 h-3.5 w-3.5" /> : <Eye className="mr-1 h-3.5 w-3.5" />}
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        <CredentialDialog isOpen={isFormOpen} onOpenChange={setIsFormOpen} onSave={handleSaveCredential} credential={editingCredential} />
      </div>
    </AppLayout>
  );
}
