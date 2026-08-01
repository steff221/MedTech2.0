// Страница што се прикажува кога нема интернет (офлајн режим).
"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="mb-6 tile h-20 w-20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3l18 18M8.111 8.111A5.5 5.5 0 0115.89 15.89M6.343 6.343A8 8 0 0117.657 17.657M2 12a10 10 0 0110-10M12 2a10 10 0 0110 10"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-800">Нема интернет врска</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Проверете ја вашата мрежна врска и обидете се повторно.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="btn-push mt-6 px-5 py-2.5 text-sm"
      >
        Обиди се повторно
      </button>
    </div>
  );
}
