const Loader = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#06B6D4] border-t-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-pulse rounded-full bg-[#06B6D4]"></div>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Chargement...
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Veuillez patienter
          </p>
        </div>
      </div>
    </div>
  );
};

export default Loader;
