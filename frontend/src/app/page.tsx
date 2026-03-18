"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wrench, Car, Gauge, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";

export default function LandingPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* NAV */}
      <header className="px-6 h-16 flex items-center backdrop-blur-md bg-white/70 dark:bg-slate-950/60 sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white dark:bg-blue-500">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-slate-900 dark:text-slate-50">
              Díaz & Díaz
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Taller Mecánico
            </span>
          </div>
        </Link>

        <nav className="ml-auto flex gap-4 items-center text-sm">
          <Link
            href="#servicios"
            className="hidden md:inline-flex text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
          >
            Servicios
          </Link>
          <Link
            href="#nosotros"
            className="hidden md:inline-flex text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
          >
            Nosotros
          </Link>
          <Link
            href="#contacto"
            className="hidden md:inline-flex text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
          >
            Contacto
          </Link>

          <ThemeToggle />

          <Button variant="outline" asChild>
            <Link href="/login">Ingresar al panel</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative w-full py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 opacity-90 dark:opacity-60" />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 lg:grid lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-white space-y-6"
            >
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide backdrop-blur">
                Taller mecánico en el que puedes confiar
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-lg">
                Díaz & Díaz
                <br />
                <span className="text-blue-100">
                  cuidado experto para tu vehículo
                </span>
              </h1>

              <p className="text-lg text-blue-100/90 max-w-xl">
                Mantenimiento y reparación profesional para autos y camionetas.
                Reserva tu hora en línea y mantén tu vehículo seguro y en
                óptimas condiciones.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="font-semibold bg-white text-blue-700 hover:bg-blue-50"
                  asChild
                >
                  <Link href="#contacto">Agendar hora</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/70 text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="#servicios">Ver servicios</Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 pt-2 text-sm text-blue-100/90">
                <div>
                  <p className="font-semibold">+10 años de experiencia</p>
                  <p>Atención honesta y transparente.</p>
                </div>
                <div>
                  <p className="font-semibold">Diagnóstico preciso</p>
                  <p>Equipos y herramientas modernas.</p>
                </div>
              </div>
            </motion.div>

            <motion.img
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
              alt="Taller mecánico Díaz & Díaz"
              className="rounded-2xl shadow-2xl object-cover aspect-video border border-white/20"
            />
          </div>
        </section>

        {/* SERVICIOS */}
        <section
          id="servicios"
          className="py-20 md:py-24 bg-slate-50 dark:bg-slate-950"
        >
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-slate-50">
              Servicios Díaz & Díaz
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
              Cuidamos cada detalle de tu vehículo, desde el mantenimiento
              básico hasta reparaciones complejas, siempre con un trato cercano
              y transparente.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Car,
                  title: "Mantenimiento preventivo",
                  desc: "Cambios de aceite, frenos, filtros y revisiones generales para evitar fallas futuras.",
                },
                {
                  icon: Gauge,
                  title: "Diagnóstico computarizado",
                  desc: "Equipos de diagnóstico para encontrar rápidamente el origen de cualquier falla.",
                },
                {
                  icon: Wrench,
                  title: "Reparaciones mecánicas",
                  desc: "Motor, transmisión, suspensión, dirección y sistemas eléctricos.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="p-7 rounded-2xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md border border-slate-200/80 dark:border-slate-800 transition"
                >
                  <item.icon className="h-12 w-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-50">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SOBRE NOSOTROS */}
        <section
          id="nosotros"
          className="py-20 md:py-24 bg-white dark:bg-slate-950"
        >
          <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">
                Un taller familiar, atención cercana
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                En <span className="font-semibold">Díaz & Díaz</span> somos un
                taller mecánico de tradición familiar. Combinamos años de
                experiencia con tecnología moderna para ofrecer un servicio
                confiable, honesto y profesional.
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Sabemos lo importante que es tu vehículo para tu día a día. Por
                eso trabajamos con total transparencia: te explicamos cada
                trabajo, tiempos estimados y costos antes de comenzar.
              </p>

              <div className="flex flex-wrap gap-6 pt-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-50">
                      Equipo certificado
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      Mecánicos con experiencia y capacitación constante.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                    <Gauge className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-50">
                      Entregas a tiempo
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      Compromiso con los plazos acordados.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.img
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              alt="Equipo Díaz & Díaz"
              src="https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80"
              className="rounded-2xl shadow-xl object-cover aspect-video border border-slate-200/70 dark:border-slate-800"
            />
          </div>
        </section>

        {/* CONTACTO */}
        <section
          id="contacto"
          className="py-20 md:py-24 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
        >
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-slate-50">
              Contáctanos
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
              ¿Necesitas un presupuesto, tienes dudas o quieres agendar una
              mantención? Escríbenos y te respondemos a la brevedad.
            </p>

            <div className="mx-auto max-w-sm text-base md:text-lg space-y-2 text-slate-800 dark:text-slate-100">
              <p>
                <b>Email:</b> contacto@diazydiaz.cl
              </p>
              <p>
                <b>Teléfono:</b> +56 9 1234 5678
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 pt-2">
                Horario: Lunes a sábado, 9:00 a 19:00 hrs.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
        © {currentYear}{" "}
        <span className="font-medium text-slate-700 dark:text-slate-200">
          Díaz & Díaz · Taller Mecánico
        </span>{" "}
        — Todos los derechos reservados.
      </footer>
    </div>
  );
}
