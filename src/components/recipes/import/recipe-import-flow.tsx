import { ImportInputStep } from "./import-input-step";
import { ImportReviewStep } from "./import-review-step";
import { useRecipeImport } from "./use-recipe-import";

export function RecipeImportFlow() {
  const importState = useRecipeImport();

  if (importState.step === "input") {
    return (
      <ImportInputStep
        importMode={importState.importMode}
        url={importState.url}
        error={importState.error}
        isAnalyzing={importState.isAnalyzing}
        previewUrls={importState.previewUrls}
        fileInputRef={importState.fileInputRef}
        selectedFilesCount={importState.selectedFiles.length}
        onModeChange={importState.handleModeChange}
        onUrlChange={importState.setUrl}
        onClearError={() => importState.setError(null)}
        onFilesSelected={importState.handleFilesSelected}
        onAnalyzeUrl={importState.handleAnalyzeUrl}
        onAnalyzePhotos={importState.handleAnalyzePhotos}
      />
    );
  }

  return (
    <ImportReviewStep
      draft={importState.draft}
      extracted={importState.extracted}
      error={importState.error}
      isReanalyzing={importState.isReanalyzing}
      isSaving={importState.isSaving}
      onDraftChange={importState.setDraft}
      onReanalyzeWithAi={importState.handleReanalyzeWithAi}
      onReset={importState.resetToInput}
      onSave={importState.handleSave}
    />
  );
}
