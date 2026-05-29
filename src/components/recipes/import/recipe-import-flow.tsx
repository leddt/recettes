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
        cameraInputRef={importState.cameraInputRef}
        galleryInputRef={importState.galleryInputRef}
        selectedFilesCount={importState.selectedFiles.length}
        onModeChange={importState.handleModeChange}
        onUrlChange={importState.setUrl}
        onClearError={() => importState.setError(null)}
        onCameraPhotoSelected={importState.handleCameraPhotoSelected}
        onGalleryPhotosSelected={importState.handleGalleryPhotosSelected}
        onRemovePhoto={importState.handleRemovePhoto}
        onAnalyzeUrl={importState.handleAnalyzeUrl}
        onAnalyzePhotos={importState.handleAnalyzePhotos}
      />
    );
  }

  return (
    <ImportReviewStep
      importMode={importState.importMode}
      draft={importState.draft}
      extracted={importState.extracted}
      previewUrls={importState.previewUrls}
      selectedCoverIndex={importState.selectedCoverIndex}
      onCoverIndexChange={importState.setSelectedCoverIndex}
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
