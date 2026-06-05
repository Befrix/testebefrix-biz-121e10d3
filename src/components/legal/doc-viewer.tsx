import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import type { LegalDoc } from "@/lib/legal-docs";

export function DocViewer({
  doc,
  trigger,
}: {
  doc: LegalDoc;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="link" size="sm" className="h-auto p-0 text-primary-glow">
            <FileText className="mr-1 h-3.5 w-3.5" /> Ler {doc.title}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{doc.title}</DialogTitle>
          <DialogDescription>Versão {doc.version} — atualizado em {doc.updatedAt}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
{doc.body}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
