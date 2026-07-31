<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/{_locale<%app.supported_locales_regex%>}')]
class ProtocolHandlerController extends AbstractController
{
    #[Route('/handler', name: 'app_protocol_handler')]
    public function __invoke(Request $request): Response
    {
        $type = (string) $request->query->get('type');

        if (!str_starts_with($type, 'web+symphone://')) {
            throw $this->createNotFoundException();
        }

        return $this->redirectToRoute('app_root');
    }
}
