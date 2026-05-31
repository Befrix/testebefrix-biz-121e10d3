import { Link } from "@tanstack/react-router";
import { Zap, Twitter, Linkedin, Github } from "lucide-react";

const cols = [
  {
    title: "Plataforma",
    items: ["Recursos", "Inteligência", "Automação", "Integrações"],
  },
  {
    title: "Empresa",
    items: ["Sobre", "Carreiras", "Imprensa", "Contato"],
  },
  {
    title: "Recursos",
    items: ["Blog", "Documentação", "API", "Status"],
  },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border-subtle bg-background">
      <div className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow-primary">
                <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-semibold tracking-tight">BEFRIX</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Outbound enterprise reinventado com IA. Capte, qualifique e converta
              leads em escala.
            </p>
            <div className="mt-6 flex gap-2">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-border-glow hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold text-foreground">{c.title}</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {c.items.map((i) => (
                  <li key={i}>
                    <a href="#" className="transition-colors hover:text-foreground">
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border-subtle pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} BEFRIX. Todos os direitos reservados.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacidade</a>
            <a href="#" className="hover:text-foreground">Termos</a>
            <span className="font-mono">v0.2 · landing</span>
          </div>
        </div>
      </div>
    </footer>
  );
}