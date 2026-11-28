import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ImagePicker } from "@/components/admin/ImagePicker";
import { ProductImage } from "@/components/products/ProductImage";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { queryKeys } from "@/lib/queryKeys";
import { productService } from "@/services/product.service";
import type { Product } from "@/types/models";
import { getErrorMessage } from "@/utils/errors";

export const MAX_PRODUCT_IMAGES = 5;

// Existing images (with delete) and uploading new ones. Images are
// changed only through the dedicated upload and delete endpoints.
export function ImageManager({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    ]);
  };

  const upload = useMutation({
    mutationFn: () => productService.uploadImages(product._id, files),
    onSuccess: async (result) => {
      setFiles([]);
      await refresh();
      toast.success(
        `${result.uploadedCount} ${result.uploadedCount === 1 ? "image" : "images"} uploaded`
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const remove = useMutation({
    mutationFn: (index: number) =>
      productService.deleteImage(product._id, index),
    onSuccess: async () => {
      setDeleteIndex(null);
      await refresh();
      toast.success("Image deleted");
    },
    onError: (error) => {
      setDeleteIndex(null);
      toast.error(getErrorMessage(error));
    },
  });

  return (
    <div>
      {product.images.length === 0 ? (
        <p className="text-sm text-muted">This product has no images yet.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {product.images.map((image, index) => (
            <li key={`${image}-${index}`} className="relative">
              <div className="aspect-square overflow-hidden rounded border border-line bg-ink/5">
                <ProductImage
                  src={image}
                  alt={`${product.name}, image ${index + 1}`}
                  width={240}
                />
              </div>
              {index === 0 ? (
                <span className="absolute left-1 top-1 rounded bg-ink px-1.5 py-0.5 text-[10px] font-medium text-paper">
                  Main
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setDeleteIndex(index)}
                aria-label={`Delete image ${index + 1}`}
                className="absolute -right-2 -top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-danger text-white shadow-card"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 border-t border-line pt-5">
        <ImagePicker
          files={files}
          onChange={setFiles}
          maxFiles={Math.max(MAX_PRODUCT_IMAGES - product.images.length, 0)}
          disabled={upload.isPending}
        />
        {files.length > 0 ? (
          <Button
            className="mt-4"
            loading={upload.isPending}
            onClick={() => upload.mutate()}
          >
            Upload {files.length} {files.length === 1 ? "image" : "images"}
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={deleteIndex !== null}
        title="Delete this image?"
        description="The image will be removed from the product."
        confirmLabel="Delete image"
        loading={remove.isPending}
        onClose={() => setDeleteIndex(null)}
        onConfirm={() => {
          if (deleteIndex !== null) {
            remove.mutate(deleteIndex);
          }
        }}
      />
    </div>
  );
}
