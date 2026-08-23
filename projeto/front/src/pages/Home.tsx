import { ArrowRight, AlertTriangle, Github } from "lucide-react";
import { useNavigate } from "react-router-dom";

const solutions = [
  {
    number: "01",
    title: "Monitoramento remoto",
    text: "Visibilidade em tempo real para acompanhar seu computador",
  },
  {
    number: "02",
    title: "Limita e protege dados",
    text: "Processos inteligentes que protegem seu sistema",
  },
];

const steps = [
  {
    number: "01",
    title: "Conecte os computadores",
    text: "Cadastre os equipamentos da escola e organize cada dispositivo por turma ou laboratório.",
  },
  {
    number: "02",
    title: "Acompanhe em tempo real",
    text: "Veja informações importantes do equipamento sem precisar estar fisicamente diante dele.",
  },
  {
    number: "03",
    title: "Tome decisões melhores",
    text: "Use histórico, armazenamento, hardware e acessos recentes para identificar necessidades.",
  },
];

const systems = [
  {
    name: "LINUX",
    image: "/linux2.png",
    link: "https://share.google/ikicVcKahlepIleS1",
  },
  {
    name: "WINDOWS",
    image: "/windows2.png",
    link: "https://share.google/SerLuWUUmQBzMdvUc",
  },
  {
    name: "CHROME OS",
    image: "/chromeos2.png",
    link: "https://share.google/dWxMInO0tviJQIpAO",
  },
];

export default function Home() {
  const navigate = useNavigate();

  const scrollToFooter = () => {
    document.getElementById("monitec-footer")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#071a36]">
      <section className="relative overflow-hidden bg-[#061a35] text-white">
        <div className="mx-auto max-w-[1180px] px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => navigate("/login")}
              className="rounded-full bg-[#123b70] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-[#7db4ff] transition hover:bg-[#17477f]"
            >
              Entrar
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="rounded-full bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-[#061a35] transition hover:bg-slate-100"
            >
              Cadastro
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-full bg-[#123b70] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-[#7db4ff] transition hover:bg-[#17477f]"
            >
              Minhas salas
            </button>
          </div>

          <div className="grid min-h-[500px] items-center gap-8 pb-10 pt-2 lg:grid-cols-2">
            <div className="relative z-10 max-w-[560px]">
              <h1 className="text-4xl font-extrabold leading-[1.04] sm:text-5xl lg:text-6xl">
                Monitoramento em
                <br />
                tempo real
              </h1>

              <p className="mt-8 max-w-[520px] text-base leading-relaxed text-[#93a3bf] sm:text-lg">
                Soluções simples para monitorar e acessar
                <br className="hidden sm:block" />
                de onde quiser
              </p>

              <button
                onClick={scrollToFooter}
                className="mt-7 inline-flex items-center gap-2.5 rounded-xl bg-[#287fdf] px-5 py-3 text-base font-bold transition hover:bg-[#1f73cf]"
              >
                Conheça a Monitec
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="relative flex min-h-[370px] items-center justify-center">
              <div className="absolute h-[330px] w-[330px] rounded-full bg-[#0a2c56] sm:h-[370px] sm:w-[370px] lg:h-[410px] lg:w-[410px]" />

              <div className="relative z-10 grid w-full max-w-[390px] grid-cols-2 rounded-xl bg-[#0b2b50]/90 px-6 py-5 text-center shadow-sm">
                <div className="border-r border-[#17416f]">
                  <div className="text-2xl font-extrabold">100%</div>
                  <div className="mt-2 text-sm text-[#9cafc7]">acessibilidade</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold">24/7</div>
                  <div className="mt-2 text-sm text-[#9cafc7]">monitoramento</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 lg:px-10">
        <h2 className="text-3xl font-extrabold text-[#174878]">Nossas soluções</h2>

        <div className="mt-9 grid gap-8 md:grid-cols-2 md:px-6">
          {solutions.map((item) => (
            <article
              key={item.number}
              className="min-h-[245px] rounded-2xl bg-[#b9d3fb] p-6 shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
            >
              <div className="text-sm font-bold text-[#1170d0]">{item.number}</div>
              <h3 className="mt-4 text-2xl font-extrabold">{item.title}</h3>
              <p className="mt-10 max-w-[420px] text-base leading-snug text-[#6c7e98]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#aab9cd] bg-[#f4f4f4]">
        <div className="mx-auto max-w-[1180px] px-5 py-11 sm:px-8 lg:px-10">
          <h2 className="text-3xl font-extrabold text-[#174878]">Arquitetura e Sistema</h2>

          <div className="mt-9 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl bg-[#061a35] px-8 py-7 text-white">
              <div className="text-xs text-[#348be4]">Inovações da Monitec</div>
              <ul className="mt-7 space-y-6 text-base">
                {[
                  "Performance rápida",
                  "Integrações via API",
                  "Design prático",
                  "Baixo uso do sistema operacional",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[#2482e5]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col justify-center rounded-2xl bg-[#b9d3fb] px-7 py-8 text-center">
              <div className="text-4xl font-extrabold">100 min</div>
              <p className="mt-2 text-base text-[#6c7e98]">Tempo médio de configuração em outros softwares</p>

              <div className="mt-9 text-4xl font-extrabold">5 min</div>
              <p className="mt-2 text-base text-[#6c7e98]">Tempo médio de configuração Monitec</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto my-8 max-w-[1180px] overflow-hidden rounded-2xl border border-[#174878] bg-[#f7f7f7] px-5 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
          <div>
            <h2 className="text-2xl font-extrabold">Como a Monitec funciona</h2>
            <p className="mt-3 max-w-[740px] text-sm leading-relaxed text-[#536983]">
              O professor acompanha à distância os computadores dos alunos em um único painel,
              com visão de histórico, armazenamento, uso do hardware e bloqueio do dispositivo.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-16 w-16 text-red-600" strokeWidth={2.5} />
            <div className="mt-2 text-base font-extrabold text-black">Em breve bloqueio de sites!</div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.number} className="rounded-xl bg-[#b9d3fb] p-5">
              <div className="text-xs font-bold text-[#1170d0]">{step.number}</div>
              <h3 className="mt-3 text-base font-extrabold">{step.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#60738e]">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-9 sm:px-8 lg:px-10">
        <h2 className="text-3xl font-extrabold">Sistemas Operacionais</h2>
        <p className="mt-3 text-base text-[#74849c]">Nosso software é multi-plataformas.</p>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        {systems.map((system) => (
         <div key={system.name} className="flex flex-col items-center justify-center">

          <a
            href={system.link}
            target="_blank"
            rel="noopener noreferrer"
            className="
            flex
            h-[150px]
            w-[190px]
            items-center
            justify-center
            border-[3px]
            border-transparent
            bg-transparent
            transition-all
            duration-200
            cursor-pointer
            hover:border-[#0b2748]
            hover:bg-[#cfe3f1]
           "
          >
           <img
             src={system.image}
             alt={system.name}
             className="max-h-[110px] w-auto max-w-[140px] object-contain"
           />
         </a>

        <div className="mt-3 text-lg font-black text-black">
          {system.name}
        </div>

      </div>
    ))}
   </div>
      </section>

      <section className="mx-auto max-w-[1180px] rounded-t-xl bg-[#0d2d59] px-7 py-6 text-white sm:px-9">
        <p className="text-base font-bold sm:text-xl">
          Prático para o professor. Claro para a escola. Tudo em um só painel.
        </p>
      </section>

      <footer id="monitec-footer" className="scroll-mt-0 bg-[#031329] text-white">
        <div className="mx-auto max-w-[1180px] px-5 py-9 sm:px-8 lg:px-10">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <h3 className="text-xl font-extrabold">Monitec</h3>
              <p className="mt-3 max-w-[240px] text-xs leading-relaxed text-[#91a1b9]">
                Monitoramento remoto para apoiar professores e escolas públicas na gestão dos computadores dos alunos.
              </p>
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase text-[#2e84dc]">Como funciona</h4>
              <div className="mt-4 space-y-3 text-xs text-[#c3cedd]">
                <p>Visão geral</p>
                <p>Monitoramento remoto</p>
                <p>Histórico e acessos</p>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase text-[#2e84dc]">Por que Monitec?</h4>
              <div className="mt-4 space-y-3 text-xs text-[#c3cedd]">
                <p>Desempenho</p>
                <p>Todas as plataformas</p>
                <p>Segurança</p>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase text-[#2e84dc]">Serviços</h4>
              <div className="mt-4 space-y-3 text-xs text-[#c3cedd]">
                <p>Gestão de dispositivos</p>
                <p>Acompanhamento escolar</p>
                <p>Suporte</p>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase text-[#2e84dc]">Contato</h4>
              <div className="mt-4 space-y-3 text-xs text-[#c3cedd]">
                <a
                 href="https://github.com/3DBMonitoraEdu"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="block transition-colors hover:text-white hover:underline"
                >
                 3DBMonitoraEdu
                </a>
                <p>Fale com a Monitec</p>
                <p>Avalie na Google</p>
              </div>
            </div>
          </div>

          <div className="mt-9 flex justify-center">
            <a
              href="https://github.com/NothNada"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform duration-200 hover:scale-110"
              aria-label="GitHub"
            >
              <Github className="h-7 w-7 text-[#b8c3d2] transition-colors hover:text-white" />
            </a>
          </div>

          <div className="mt-9 border-t border-[#173252] pt-5 text-xs text-[#7f90a7]">
            © 2026 Monitec — Monitoramento e gestão de computadores escolares
          </div>
        </div>
      </footer>
    </div>
  );
}