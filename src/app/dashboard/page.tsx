"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getResumes,
  getCoverLetters,
  deleteResume,
  deleteCoverLetter,
  duplicateResume,
  duplicateCoverLetter,
  updateResume,
  updateCoverLetter,
  SavedResume,
  SavedCoverLetter,
} from "@/lib/store/documentStore";
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
import { FileText, Mail, Plus, MoreVertical, Edit, Copy, Trash2, Clock, Pencil, Search, Sparkles } from "lucide-react";

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
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [coverLetters, setCoverLetters] = useState<SavedCoverLetter[]>([]);
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

  const loadDocuments = () => {
    setResumes(getResumes());
    setCoverLetters(getCoverLetters());
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = () => {
    if (!deleteDialog) return;
    
    if (deleteDialog.type === "resume") {
      deleteResume(deleteDialog.id);
    } else {
      deleteCoverLetter(deleteDialog.id);
    }
    
    loadDocuments();
    setDeleteDialog(null);
  };

  const handleDuplicate = (type: "resume" | "coverLetter", id: string) => {
    if (type === "resume") {
      duplicateResume(id);
    } else {
      duplicateCoverLetter(id);
    }
    loadDocuments();
  };

  const handleRenameOpen = (type: "resume" | "coverLetter", id: string, currentName: string) => {
    setRenameDialog({ type, id, name: currentName });
    setNewName(currentName);
  };

  const handleRename = () => {
    if (!renameDialog || !newName.trim()) return;
    
    if (renameDialog.type === "resume") {
      updateResume(renameDialog.id, { name: newName.trim() });
    } else {
      updateCoverLetter(renameDialog.id, { name: newName.trim() });
    }
    
    loadDocuments();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
            <p className="text-gray-500">Manage your resumes and cover letters</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/interview-prep")} variant="outline" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Prepare for Interview
            </Button>
            <Button onClick={() => router.push("/find-jobs")} className="gap-2">
              <Search className="w-4 h-4" />
              Find Jobs
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="resumes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Resumes ({resumes.length})
            </TabsTrigger>
            <TabsTrigger value="coverLetters" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Cover Letters ({coverLetters.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Resumes</CardTitle>
                  <CardDescription>Your saved resumes</CardDescription>
                </div>
                <Button onClick={() => handleCreateNew("resume")} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Resume
                </Button>
              </CardHeader>
              <CardContent>
                {resumes.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes yet</h3>
                    <p className="text-gray-500 mb-4">Create your first resume to get started</p>
                    <Button onClick={() => handleCreateNew("resume")}>
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cover Letters</CardTitle>
                  <CardDescription>Your saved cover letters</CardDescription>
                </div>
                <Button onClick={() => handleCreateNew("coverLetter")} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Cover Letter
                </Button>
              </CardHeader>
              <CardContent>
                {coverLetters.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No cover letters yet</h3>
                    <p className="text-gray-500 mb-4">Create your first cover letter</p>
                    <Button onClick={() => handleCreateNew("coverLetter")}>
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
