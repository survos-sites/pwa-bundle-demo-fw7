<?php

namespace App\Controller\Feature;

use SpomkyLabs\PwaBundle\Attribute\PreloadUrl;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/{_locale<%app.supported_locales_regex%>}')]
class FileHandlingController extends AbstractController
{
    #[PreloadUrl('pages', ['_locale' => 'en_US'])]
    #[PreloadUrl('pages', ['_locale' => 'fr_FR'])]
    #[Route('/file-handling', name: 'app_feature_file_handling', methods: [Request::METHOD_GET])]
    public function __invoke(Request $request): Response
    {
        if ($request->headers->get('Sec-Fetch-Dest') === 'document') {
            return $this->render('homepage/index.html.twig');
        }

        return $this->render('features/file_handling.html.twig');
    }
}
