<?php

namespace App\Controller\Feature;

use SpomkyLabs\PwaBundle\Attribute\PreloadUrl;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/{_locale<%app.supported_locales_regex%>}')]
class ShareTargetController extends AbstractController
{
    #[PreloadUrl('pages', ['_locale' => 'en_US'])]
    #[PreloadUrl('pages', ['_locale' => 'fr_FR'])]
    #[Route('/share-target', name: 'app_feature_share_target', methods: [Request::METHOD_GET])]
    public function __invoke(): Response
    {
        return $this->render('features/share_target.html.twig');
    }

    #[Route('/share-target/receive', name: 'app_share_target_receive', methods: [Request::METHOD_POST])]
    public function receive(Request $request): Response
    {
        $image = $request->files->get('image');
        if (!$image instanceof UploadedFile || !$image->isValid()) {
            return $this->renderResult('No valid image was received. Select one image and share it again.');
        }

        $mediaType = $image->getMimeType();
        $acceptedTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($mediaType, $acceptedTypes, true)) {
            return $this->renderResult('Symphone accepts JPEG, PNG, WebP, and GIF images for this demonstration.');
        }

        $fileSize = $image->getSize();
        if (!is_int($fileSize)) {
            return $this->renderResult('The size of the received image could not be determined.');
        }

        if ($fileSize > 10 * 1024 * 1024) {
            return $this->renderResult('The selected image is larger than the 10 MB demonstration limit.');
        }

        $contents = file_get_contents($image->getPathname());
        if ($contents === false) {
            return $this->renderResult('The received image could not be read.');
        }

        return $this->render('features/share_target_result.html.twig', [
            'error' => null,
            'image_data' => sprintf('data:%s;base64,%s', $mediaType, base64_encode($contents)),
            'filename' => $image->getClientOriginalName(),
            'media_type' => $mediaType,
            'file_size' => $this->formatFileSize($fileSize),
        ]);
    }

    private function renderResult(string $error): Response
    {
        return $this->render('features/share_target_result.html.twig', [
            'error' => $error,
            'image_data' => null,
            'filename' => null,
            'media_type' => null,
            'file_size' => null,
        ]);
    }

    private function formatFileSize(int $bytes): string
    {
        if ($bytes < 1024) {
            return sprintf('%d B', $bytes);
        }
        if ($bytes < 1024 * 1024) {
            return sprintf('%.1f KB', $bytes / 1024);
        }

        return sprintf('%.1f MB', $bytes / (1024 * 1024));
    }
}
