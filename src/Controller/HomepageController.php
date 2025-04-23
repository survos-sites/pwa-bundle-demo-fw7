<?php

namespace App\Controller;

use App\Form\ItemHandler;
use App\Repository\ItemRepository;
use SpomkyLabs\PwaBundle\Service\CacheStrategy;
use SpomkyLabs\PwaBundle\Attribute\PreloadUrl;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/{_locale<%app.supported_locales_regex%>}')]
class HomepageController extends AbstractController
{
    #[PreloadUrl('pages', ['_locale' => 'en_US'])]
    #[PreloadUrl('pages', ['_locale' => 'fr_FR'])]
    #[Route('', name: 'app_homepage', methods: [Request::METHOD_GET])]
    public function __invoke(): Response
    {
        return $this->render('homepage/index.html.twig');
    }

    #[Route('/add', name: 'app_add_item', methods: [Request::METHOD_POST])]
    public function addItem(Request $request): Response
    {
        $form = $this->itemHandler->prepare();
        $item = $this->itemHandler->handle($form, $request);
        if ($item !== null) {
            $this->addFlash('success', 'Item added');
            return $this->redirectToRoute('app_homepage');
        }
        $this->addFlash('error', 'Item not added');
        return $this->redirectToRoute('app_homepage');
    }

    #[Route('/items/{id}/toggle', name: 'app_toggle', methods: [Request::METHOD_POST])]
    public function toggle(string $id): Response
    {
        $item = $this->itemRepository->findOneById($id);
        if ($item !== null) {
            $item->toggle();
            $this->itemRepository->save($item);
        }
        $this->addFlash('success', 'Item state changed');

        return $this->redirectToRoute('app_homepage');
    }

    #[Route('/items/{id}/remove', name: 'app_remove', methods: [Request::METHOD_POST])]
    public function remove(string $id): Response
    {
        $item = $this->itemRepository->findOneById($id);
        if ($item !== null) {
            $this->itemRepository->remove($item);
        }
        $this->addFlash('success', 'Item removed');

        return $this->redirectToRoute('app_homepage');
    }

    #[Route('/about', name: 'app_about', methods: [Request::METHOD_GET])]
    public function about(Request $request): Response
    {
        return $this->render('app/about.html.twig');
    }

    /* Framework7 JS Files */
    #[Route('/js/config.js', name: 'f7_app_config_js')]
    public function f7_app_config_js(): Response
    {
        $response = new Response();
        $response->headers->set('Content-Type', 'application/javascript');
        return $this->render('js/config.js.twig', [], $response);
    }

    #[Route('/js/routes.js', name: 'f7_app_routes_js')]
    public function f7_app_routes_js(): Response
    {
        $response = new Response();
        $response->headers->set('Content-Type', 'application/javascript');
        return $this->render('js/routes.js.twig', [], $response);
    }

    #[Route('/js/store.js', name: 'f7_app_store_js')]
    public function f7_app_store_js(): Response
    {
        $response = new Response();
        $response->headers->set('Content-Type', 'application/javascript');
        return $this->render('js/store.js.twig', [], $response);
    }

    #[Route('/js/init.js', name: 'f7_app_init_js')]
    public function f7_app_init_js(): Response
    {
        $response = new Response();
        $response->headers->set('Content-Type', 'application/javascript');
        return $this->render('js/init.js.twig', [], $response);
    }

    /* Framework7 HTML Partials */
    #[Route('/partials/app.html', name: 'f7_app_partial_root_html')]
    public function f7_app_partial_root_html(): Response
    {
        return $this->render('/partials/app.html.twig');
    }

    #[Route('/partials/home.html', name: 'f7_app_partial_home_html')]
    public function f7_app_partial_home_html(): Response
    {
        return $this->render('/partials/home.html.twig');
    }

}
