import Image from "next/image";
import Link from "next/link";

const highlights = [
  {
    title: "Build exams your way",
    description:
      "Mix MCQ, multi-select, short answer, and coding questions in one clean flow.",
  },
  {
    title: "Share secure test links",
    description:
      "Create a test, publish it, and send one direct link to candidates without extra setup.",
  },
  {
    title: "Track attempts and results",
    description:
      "Review conducted exams, see participation, and check how each learner performed.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#171717] px-3 py-3 text-[#2f2924] sm:px-5 sm:py-5">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[34px] border border-white/10 bg-[#1f1e1b] shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
        <header className="flex items-center justify-between gap-6 rounded-t-[34px] border-b border-white/10 bg-[#1b1a18] px-5 py-4 text-[#f3ede3] sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-sm font-semibold">
              <img src="/test.png" width="24" height="24" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Online Proctoring System</p>
              <p className="text-xs text-[#d6cec0] font-sans">Online exam workspace</p>
            </div>
          </div>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 text-sm text-[#d8d1c4] md:flex font-sans">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#workflow" className="transition hover:text-white">
              Workflow
            </a>
            <a href="#results" className="transition hover:text-white">
              Results
            </a>
          </nav>

          <Link
            href="/login"
            className="rounded-xl border border-[#c9bea9] bg-[#f4ebdc] px-4 py-2 text-sm font-semibold text-[#25211c] transition hover:-translate-y-0.5 hover:bg-white font-sans"
          >
            Login
          </Link>
        </header>

        <section
          className="relative overflow-hidden rounded-bl-[34px] rounded-br-[34px] bg-[#efe6d7] px-5 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-10 lg:px-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at top left, rgba(255,255,255,0.55), transparent 22%), repeating-linear-gradient(135deg, rgba(80,62,45,0.035) 0, rgba(80,62,45,0.035) 2px, transparent 2px, transparent 7px)",
            borderBottomLeftRadius: "34px",
            borderBottomRightRadius: "34px",
          }}
        >
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d9cdb9] bg-white/70 px-4 py-2 text-sm font-medium text-[#51473f] shadow-sm font-sans">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#2a7a6e]" />
              Designed for creating, sharing, and reviewing online exams
            </div>

            <h1 className="mx-auto mt-8 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-[#312b27] sm:text-6xl lg:text-7xl">
              Secure, Fast and Reliable
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#6f655c] sm:text-lg">
              Create tests, publish secure links, support multiple question
              types, and track outcomes from one focused workspace built for
              modern online assessments.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-w-40 items-center justify-center rounded-2xl border border-[#cabca7] bg-[#2b2723] px-6 py-3 text-sm font-semibold text-[#f8f3ea] transition hover:-translate-y-0.5 hover:bg-black font-sans"
              >
                Let&apos;s get started
              </Link>
              <Link
                href="/create-acc"
                className="inline-flex min-w-40 items-center justify-center rounded-2xl border border-[#d6c7b0] bg-[#fbf6ee] px-6 py-3 text-sm font-semibold text-[#3d372f] transition hover:-translate-y-0.5 hover:bg-white font-sans"
              >
                Create account
              </Link>
            </div>
          </div>

          <div className="relative mx-auto mt-12 max-w-6xl">
            <div className="absolute right-6 top-10 hidden rounded-[28px] border border-white/80 bg-white/95 px-5 py-4 shadow-[0_18px_45px_rgba(50,35,20,0.15)] lg:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7d7369]">
                Live stats
              </p>
              <div className="mt-3 flex items-end gap-3">
                <p className="text-3xl font-semibold tracking-tight text-[#2f2924]">
                  24
                </p>
                <p className="pb-1 text-sm text-[#6f655c] font-sans">active attempts</p>
              </div>
              <div className="mt-3 h-2.5 w-40 overflow-hidden rounded-full bg-[#ece3d5]">
                <div className="h-full w-[72%] rounded-full bg-[#2a7a6e]" />
              </div>
              <p className="mt-2 text-xs text-[#6f655c] font-sans">
                Smooth candidate flow across shared exam links
              </p>
            </div>

            <div className="relative z-10 overflow-hidden rounded-[34px] border border-white/70 bg-[#f9f4ec] p-2 shadow-[0_24px_70px_rgba(52,39,25,0.18)] sm:p-3">
              <div className="relative overflow-hidden rounded-[30px] border border-black/10 bg-[#e7dcc8]">
                <div className="absolute inset-0 rounded-[30px] bg-gradient-to-tr from-black/10 via-transparent to-white/20" />
                <Image
                  src="/hero-image.png"
                  alt="Student taking an online exam"
                  width={1024}
                  height={1024}
                  className="h-[320px] w-full rounded-[30px] object-cover object-center sm:h-[460px] lg:h-[560px]"
                  priority
                />

                <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3 sm:bottom-6 sm:left-6 sm:right-auto">
                  <div className="w-fit overflow-hidden rounded-full border border-white/30 bg-[#1f1d1abf] px-5 py-3 text-left backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#d7d0c3] font-sans">
                      Built for teams
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      One dashboard for creators and test takers
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section
            id="features"
            className="mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-3"
          >
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-[26px] border border-[#d8cab5] bg-[#f8f1e7]/80 p-6 shadow-[0_10px_30px_rgba(70,50,30,0.06)]"
              >
                <p className="text-lg font-semibold tracking-tight text-[#2f2924]">
                  {item.title}
                </p>
                <p className="mt-3 text-sm leading-6 text-[#6f655c] font-sans">
                  {item.description}
                </p>
              </article>
            ))}
          </section>

          <section
            id="workflow"
            className="mx-auto mt-10 grid max-w-6xl gap-5 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div className="rounded-[30px] border border-[#d8cab5] bg-[#f8f1e7] p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7d7369] font-sans">
                Workflow
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#2f2924]">
                Easy to work with
              </h2>
              <div className="mt-6 grid gap-4 text-sm text-[#5e554d] sm:grid-cols-3 font-sans">
                <div className="rounded-2xl bg-white/60 p-4">
                  <p className="font-semibold text-[#2f2924]">1. Create</p>
                  <p className="mt-2 leading-6">
                    Set title, add questions, and configure the exam in one
                    flow.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/60 p-4">
                  <p className="font-semibold text-[#2f2924]">2. Share</p>
                  <p className="mt-2 leading-6">
                    Send the generated exam link so candidates can start fast.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/60 p-4">
                  <p className="font-semibold text-[#2f2924]">3. Review</p>
                  <p className="mt-2 leading-6">
                    Check attempts, participation, and results from the
                    dashboard.
                  </p>
                </div>
              </div>
            </div>

            <div
              id="results"
              className="rounded-[30px] border border-[#d8cab5] bg-[#2b2723] p-7 text-[#f3ede3]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#cbbfac] font-sans">
                Results
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Keep the final promise simple: launch exams and measure outcomes.
              </h2>
              <div className="mt-6 space-y-3 text-sm text-[#d6cec1] font-sans">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Conducted exams stay visible in one place for quick follow-up.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Taken exams show scores and help learners review performance.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  The design now highlights your real value instead of generic
                  SaaS copy.
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
