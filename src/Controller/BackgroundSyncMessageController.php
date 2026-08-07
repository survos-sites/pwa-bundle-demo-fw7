<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class BackgroundSyncMessageController
{
    #[Route('/background-sync/messages', name: 'app_background_sync_message', methods: [Request::METHOD_POST])]
    public function __invoke(Request $request): JsonResponse
    {
        return new JsonResponse([
            'id' => $request->request->getString('id'),
            'receivedAt' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
        ], JsonResponse::HTTP_CREATED);
    }
}
