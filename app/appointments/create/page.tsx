export default function CreateAppointmentPage() {
  return (
    <main className="py-10 text-center">
      <div className="max-w-md mx-auto rounded-2xl bg-card text-card-foreground border border-border p-8 shadow-sm">
        <h1 className="text-xl font-bold text-card-foreground">
          Novo Agendamento
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Selecione um serviço na página de serviços para realizar um
          agendamento.
        </p>
      </div>
    </main>
  );
}
