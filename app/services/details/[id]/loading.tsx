export default function LoadingDetails() {
  return (
    <div className="py-20 flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-sm font-medium text-muted-foreground">
        Carregando detalhes do serviço...
      </p>
    </div>
  );
}
