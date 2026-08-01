<?php

namespace App\Controller\Feature;

use SpomkyLabs\PwaBundle\Attribute\PreloadUrl;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/{_locale<%app.supported_locales_regex%>}')]
class WebShareController extends AbstractController
{
    #[PreloadUrl('pages', ['_locale' => 'en_US'])]
    #[PreloadUrl('pages', ['_locale' => 'fr_FR'])]
    #[Route('/web-share', name: 'app_feature_web_share', methods: [Request::METHOD_GET])]
    public function __invoke(Request $request): Response
    {
        return $this->render('features/web_share.html.twig', [
            'share' => [
                'title' => 'Symphone',
                'text' => 'A Symfony based project to demonstrate the use of pwa-bundle and fw-bundle.',
                'url' => $request->getSchemeAndHttpHost().'/',
            ],
        ]);
    }
}
