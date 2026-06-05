// Documentos legais da plataforma BEFRIX (conteúdo estático, versionado).
// O aceite é registrado em audit_logs (sem tabela nova).

export type LegalDocId = "termo_uso" | "politica_privacidade" | "contrato_saas";

export type LegalDoc = {
  id: LegalDocId;
  title: string;
  version: string;
  updatedAt: string;
  acceptanceLabel: string;
  required_on_onboarding: boolean;
  body: string;
};

const TERMO = `Última atualização: Junho de 2026

Ao utilizar a plataforma BEFRIX, o usuário declara que leu, compreendeu e concorda com os termos abaixo.

1. OBJETIVO DA PLATAFORMA
A BEFRIX é uma plataforma de inteligência comercial, automação e geração de oportunidades de negócios que auxilia empresas na identificação de potenciais clientes, gestão de campanhas, análise de dados e acompanhamento de resultados. Atua como ferramenta de apoio à operação comercial e não substitui a análise, validação ou tomada de decisão realizada pelos usuários.

2. RESPONSABILIDADE SOBRE AS INFORMAÇÕES FORNECIDAS
O usuário é integralmente responsável pela veracidade, atualização e qualidade das informações cadastradas na plataforma: dados da empresa, ICP, oferta comercial, segmentos, objetivos, integrações e bases de contatos/eventos importados. Informações incompletas, incorretas ou desatualizadas podem impactar a qualidade dos resultados.

3. RESULTADOS E EXPECTATIVAS
Os resultados podem variar conforme qualidade das informações, clareza da oferta, definição do ICP, segmento, região, concorrência, sazonalidade, volume de dados, taxas de resposta, capacidade operacional, cenário econômico e estratégias adotadas. A BEFRIX não garante quantidade mínima de leads, reuniões, oportunidades, vendas ou faturamento. Qualquer estimativa é referência estratégica, não garantia.

4. INTEGRAÇÕES E SERVIÇOS DE TERCEIROS
A plataforma pode se integrar a serviços de terceiros (comunicação, automação, IA, armazenamento). A disponibilidade depende dos respectivos fornecedores. A BEFRIX não se responsabiliza por falhas originadas em plataformas de terceiros.

5. USO ADEQUADO
É proibido utilizar a plataforma para práticas ilícitas, spam, fraudes, coleta indevida de dados, violação de direitos de terceiros ou atividades que comprometam a segurança. A BEFRIX poderá suspender ou encerrar contas que violem estas condições.

6. LIMITAÇÃO DE RESPONSABILIDADE
A BEFRIX não será responsável por perda de negócios, receita, contratos, oportunidades, danos indiretos ou consequenciais, nem por decisões tomadas exclusivamente com base em informações da plataforma.

7. DISPONIBILIDADE
Poderão ocorrer atualizações, manutenções programadas, interrupções temporárias e instabilidades de provedores externos.

8. PRIVACIDADE E PROTEÇÃO DE DADOS
O usuário declara possuir autorização legal para utilizar, armazenar e processar os dados inseridos na plataforma.

9. ACEITE
Ao marcar a opção "Li e concordo com os Termos de Uso" e utilizar a plataforma, o usuário declara estar ciente e de acordo com todas as condições. O aceite é condição obrigatória para utilização da plataforma.`;

const POLITICA = `Última atualização: Junho de 2026

A BEFRIX respeita a privacidade de seus usuários e está comprometida com a proteção dos dados pessoais tratados por meio da plataforma.

1. DADOS COLETADOS
Nome, email, telefone, empresa, cargo, informações de faturamento, dados inseridos no onboarding e informações de integrações autorizadas. Também coletamos IP, navegador, sistema operacional, logs de acesso e eventos de uso.

2. FINALIDADE
Prestação dos serviços, autenticação e segurança, personalização, análises e relatórios, suporte técnico, comunicação operacional e cumprimento de obrigações legais.

3. COMPARTILHAMENTO
Compartilhamos com fornecedores necessários: hospedagem, banco de dados, processamento de pagamentos, comunicação, automação e inteligência computacional, apenas quando necessário.

4. SEGURANÇA
Adotamos medidas técnicas e organizacionais para proteger os dados contra acesso não autorizado, perda, alteração ou divulgação indevida.

5. DIREITOS DO TITULAR (LGPD)
Confirmação do tratamento, acesso, correção, exclusão, revogação de consentimentos e portabilidade quando legalmente possível.

6. RETENÇÃO
Pelo período necessário à prestação dos serviços, obrigações legais e proteção de interesses legítimos.

7. ALTERAÇÕES
A Política poderá ser atualizada periodicamente. A continuidade do uso representa concordância com a versão vigente.`;

const CONTRATO = `Última atualização: Junho de 2026

Este contrato regula o acesso e utilização da plataforma BEFRIX.

1. OBJETO
A BEFRIX disponibiliza uma plataforma SaaS para apoio a operações comerciais. A contratação concede direito de uso, sem transferência de propriedade intelectual.

2. PLANOS E LIMITES
O acesso depende do plano contratado. Cada plano possui limites de usuários, workspaces, leads, eventos, integrações, armazenamento e funcionalidades premium.

3. PAGAMENTOS
Conforme o plano contratado. Inadimplência pode resultar em restrição de funcionalidades, suspensão temporária ou cancelamento.

4. CANCELAMENTO
O cliente pode cancelar a qualquer momento. O acesso permanece até o fim do período já pago. Valores pagos não são reembolsados, exceto quando exigido por lei.

5. DISPONIBILIDADE
Buscamos elevada disponibilidade, sem garantir operação ininterrupta. Manutenções e atualizações ocorrerão periodicamente.

6. PROPRIEDADE INTELECTUAL
Todo software, interface, design, marca, metodologia e conteúdo pertencem à BEFRIX. Reprodução, engenharia reversa ou exploração não autorizada são proibidas.

7. LIMITAÇÃO DE RESPONSABILIDADE
A BEFRIX não garante quantidade de leads, reuniões, conversões, receita, crescimento comercial ou retorno financeiro.

8. SUSPENSÃO
A BEFRIX poderá suspender ou encerrar contas que descumpram estes termos, usem a plataforma para fins ilícitos ou comprometam a segurança.

9. DISPOSIÇÕES FINAIS
A utilização representa concordância integral com este contrato. Aplica-se a legislação brasileira.`;

export const LEGAL_DOCS: Record<LegalDocId, LegalDoc> = {
  termo_uso: {
    id: "termo_uso",
    title: "Termo de Consentimento e Uso da Plataforma BEFRIX",
    version: "2026-06",
    updatedAt: "Junho de 2026",
    acceptanceLabel: "Li e concordo com o Termo de Consentimento e Uso da BEFRIX",
    required_on_onboarding: true,
    body: TERMO,
  },
  politica_privacidade: {
    id: "politica_privacidade",
    title: "Política de Privacidade — BEFRIX",
    version: "2026-06",
    updatedAt: "Junho de 2026",
    acceptanceLabel: "Li e concordo com a Política de Privacidade da BEFRIX",
    required_on_onboarding: true,
    body: POLITICA,
  },
  contrato_saas: {
    id: "contrato_saas",
    title: "Contrato de Prestação de Serviços SaaS — BEFRIX",
    version: "2026-06",
    updatedAt: "Junho de 2026",
    acceptanceLabel: "Li e concordo com o Contrato de Prestação de Serviços SaaS da BEFRIX",
    required_on_onboarding: false,
    body: CONTRATO,
  },
};

export const ONBOARDING_REQUIRED_DOCS: LegalDoc[] = [
  LEGAL_DOCS.termo_uso,
  LEGAL_DOCS.politica_privacidade,
];

export const SETTINGS_VISIBLE_DOCS: LegalDoc[] = [
  LEGAL_DOCS.termo_uso,
  LEGAL_DOCS.politica_privacidade,
];

/**
 * Registra o aceite de um documento legal em audit_logs.
 * Reutiliza a estrutura de auditoria existente — não cria tabela nova.
 */
export async function recordLegalConsent(opts: {
  supabase: any;
  tenantId: string;
  userId: string;
  doc: LegalDoc;
  source: "onboarding" | "settings" | "payment_confirmation";
  status?: "accepted" | "revoked";
}) {
  const status = opts.status ?? "accepted";
  return opts.supabase.from("audit_logs").insert({
    tenant_id: opts.tenantId,
    user_id: opts.userId,
    action: "document_accepted",
    entity: "legal_document",
    metadata: {
      document_id: opts.doc.id,
      document_title: opts.doc.title,
      version: opts.doc.version,
      status,
      source: opts.source,
      accepted_at: new Date().toISOString(),
    } as any,
  });
}
