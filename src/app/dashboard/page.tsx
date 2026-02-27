"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useResumes, SavedResume } from "@/hooks/useResumes";
import { useCoverLetters, SavedCoverLetter } from "@/hooks/useCoverLetters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Mail, Plus, MoreVertical, Edit, Copy, Trash2, Clock, Pencil, Search, Sparkles, Loader2, LogOut, User, Settings, Crown, CreditCard, PenSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const { isTrialing, trialExpired, trialDaysRemaining, isLoading: subscriptionLoading, refetch } = useSubscription();

  // Handle checkout success - verify and activate subscription
  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");
    const sessionToken = searchParams.get("customer_session_token");
    
    if (checkoutStatus === "success") {
      fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerSessionToken: sessionToken }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            refetch();
            // Clean URL
            router.replace("/dashboard");
          }
        })
        .catch(console.error);
    }
  }, [searchParams]);
  
  const {
    resumes,
    loading: resumesLoading,
    deleteResume,
    duplicateResume,
    updateResume,
  } = useResumes();
  
  const {
    coverLetters,
    loading: coverLettersLoading,
    deleteCoverLetter,
    duplicateCoverLetter,
    updateCoverLetter,
  } = useCoverLetters();

  const [activeTab, setActiveTab] = useState("resumes");
  const [deleteDialog, setDeleteDialog] = useState<{
    type: "resume" | "coverLetter";
    id: string;
    name: string;
  } | null>(null);
  const [renameDialog, setRenameDialog] = useState<{
    type: "resume" | "coverLetter";
    id: string;
    name: string;
  } | null>(null);
  const [newName, setNewName] = useState("");

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    
    if (deleteDialog.type === "resume") {
      await deleteResume(deleteDialog.id);
    } else {
      await deleteCoverLetter(deleteDialog.id);
    }
    
    setDeleteDialog(null);
  };

  const handleDuplicate = async (type: "resume" | "coverLetter", id: string) => {
    if (type === "resume") {
      await duplicateResume(id);
    } else {
      await duplicateCoverLetter(id);
    }
  };

  const handleRenameOpen = (type: "resume" | "coverLetter", id: string, currentName: string) => {
    setRenameDialog({ type, id, name: currentName });
    setNewName(currentName);
  };

  const handleRename = async () => {
    if (!renameDialog || !newName.trim()) return;
    
    if (renameDialog.type === "resume") {
      await updateResume(renameDialog.id, { name: newName.trim() });
    } else {
      await updateCoverLetter(renameDialog.id, { name: newName.trim() });
    }
    
    setRenameDialog(null);
    setNewName("");
  };

  const handleEdit = (type: "resume" | "coverLetter", id: string) => {
    if (type === "resume") {
      router.push(`/resume?id=${id}`);
    } else {
      router.push(`/cover-letter?id=${id}`);
    }
  };

  const handleCreateNew = (type: "resume" | "coverLetter") => {
    if (type === "resume") {
      router.push("/resume");
    } else {
      router.push("/cover-letter");
    }
  };

  if (resumesLoading || coverLettersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading your documents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Trial Expired Modal */}
      {trialExpired && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
              <Crown className="h-10 w-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Free Trial Has Ended</h2>
            <p className="text-gray-600 mb-6">
              Your 3-day free trial has expired. Upgrade to Pro to continue using all premium features and take your career to the next level.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push("/pricing")} 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg h-12 text-lg"
              >
                <Crown className="h-5 w-5 mr-2" />
                Upgrade to Pro
              </Button>
              <p className="text-sm text-gray-500">
                Starting at just $7.85/month
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trial Banner */}
      {isTrialing && trialDaysRemaining !== null && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5" />
              <span className="font-medium">
                Free Trial: {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining
              </span>
            </div>
            <Button 
              onClick={() => router.push("/pricing")} 
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-0 h-8 px-4"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      )}

      {/* Header with Logo */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="LinImpact.ai Logo" 
              className="w-20 h-20 object-contain"
            />
            <span className="text-3xl font-extrabold tracking-tight -ml-3" style={{ fontFamily: 'var(--font-poppins)' }}>
              <span className="text-cyan-500">Lin</span><span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">Impact</span><span className="text-slate-500 font-semibold">.ai</span>
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <Button onClick={() => router.push("/interview-prep")} variant="outline" className="gap-2 border-blue-200 hover:bg-blue-50 h-11 px-5 text-base">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="hidden sm:inline">Prepare for Interview</span>
            </Button>
            <Button onClick={() => router.push("/find-jobs")} className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-11 px-5 text-base">
              <Search className="w-5 h-5" />
              <span className="hidden sm:inline">Find Jobs</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 rounded-full hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <Avatar className="w-11 h-11 border-2 border-blue-200">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-semibold text-sm">
                      {user?.user_metadata?.full_name 
                        ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                        : user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/billing")} className="cursor-pointer">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/admin/blog")} className="cursor-pointer">
                  <PenSquare className="w-4 h-4 mr-2" />
                  Blog Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">My Documents</h1>
            <p className="text-gray-500">
              {user?.user_metadata?.full_name ? `Welcome, ${user.user_metadata.full_name}` : user?.email ? `Welcome, ${user.email}` : "Manage your resumes and cover letters"}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-blue-50 border border-blue-100">
            <TabsTrigger value="resumes" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4" />
              Resumes ({resumes.length})
            </TabsTrigger>
            <TabsTrigger value="coverLetters" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
              <Mail className="h-4 w-4" />
              Cover Letters ({coverLetters.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumes">
            <Card className="border-blue-100 shadow-lg shadow-blue-500/5 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                <div>
                  <CardTitle className="text-blue-900">Resumes</CardTitle>
                  <CardDescription>Your saved resumes</CardDescription>
                </div>
                <Button onClick={() => handleCreateNew("resume")} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/25">
                  <Plus className="h-4 w-4" />
                  Create New Resume
                </Button>
              </CardHeader>
              <CardContent>
                {resumes.length === 0 ? (
                  <div className="text-center py-12 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 rounded-lg">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                      <FileText className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-medium text-blue-900 mb-2">No resumes yet</h3>
                    <p className="text-gray-500 mb-4">Create your first resume to get started</p>
                    <Button onClick={() => handleCreateNew("resume")} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/25">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Resume
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Modified</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resumes
                        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                        .map((resume) => (
                          <TableRow key={resume.id} className="cursor-pointer hover:bg-gray-50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-blue-500" />
                                <span>{resume.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-500">{resume.templateId}</TableCell>
                            <TableCell className="text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDate(resume.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-500">{formatDate(resume.updatedAt)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit("resume", resume.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRenameOpen("resume", resume.id, resume.name)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicate("resume", resume.id)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() =>
                                      setDeleteDialog({
                                        type: "resume",
                                        id: resume.id,
                                        name: resume.name,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coverLetters">
            <Card className="border-blue-100 shadow-lg shadow-blue-500/5 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                <div>
                  <CardTitle className="text-blue-900">Cover Letters</CardTitle>
                  <CardDescription>Your saved cover letters</CardDescription>
                </div>
                <Button onClick={() => handleCreateNew("coverLetter")} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/25">
                  <Plus className="h-4 w-4" />
                  Create New Cover Letter
                </Button>
              </CardHeader>
              <CardContent>
                {coverLetters.length === 0 ? (
                  <div className="text-center py-12 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 rounded-lg">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                      <Mail className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-medium text-blue-900 mb-2">No cover letters yet</h3>
                    <p className="text-gray-500 mb-4">Create your first cover letter</p>
                    <Button onClick={() => handleCreateNew("coverLetter")} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/25">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Cover Letter
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Modified</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coverLetters
                        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                        .map((letter) => (
                          <TableRow key={letter.id} className="cursor-pointer hover:bg-gray-50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-green-500" />
                                <span>{letter.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-500">
                              {letter.coverLetterData.companyName || "-"}
                            </TableCell>
                            <TableCell className="text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDate(letter.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-500">{formatDate(letter.updatedAt)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit("coverLetter", letter.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRenameOpen("coverLetter", letter.id, letter.name)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicate("coverLetter", letter.id)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() =>
                                      setDeleteDialog({
                                        type: "coverLetter",
                                        id: letter.id,
                                        name: letter.name,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteDialog?.type === "resume" ? "Resume" : "Cover Letter"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameDialog} onOpenChange={() => setRenameDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {renameDialog?.type === "resume" ? "Resume" : "Cover Letter"}</DialogTitle>
            <DialogDescription>
              Enter a new name for &quot;{renameDialog?.name}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-name">Name</Label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRename();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
