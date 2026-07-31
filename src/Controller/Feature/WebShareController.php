<?php

namespace App\Controller\Feature;

use SpomkyLabs\PwaBundle\Attribute\PreloadUrl;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Routing\RouterInterface;

#[Route('/{_locale<%app.supported_locales_regex%>}')]
class WebShareController extends AbstractController
{
    public function __construct(
        private readonly RouterInterface $router
    )
    {
    }

    #[PreloadUrl('pages', ['_locale' => 'en_US'])]
    #[PreloadUrl('pages', ['_locale' => 'fr_FR'])]
    #[Route('/web-share', name: 'app_feature_web_share', methods: [Request::METHOD_GET])]
    public function __invoke(): Response
    {
        return $this->render('features/web_share.html.twig', [
            'link' => [
                "title" =>"Symphone",
                "url" => $this->router->generate('app_homepage', [], UrlGeneratorInterface::ABSOLUTE_URL),
            ],
            'text' => [
                "title" =>"Symphone",
                "text" =>"Share this page around the world",
            ],
        ]);
    }
}
