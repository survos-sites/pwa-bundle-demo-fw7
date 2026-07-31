<?php

declare(strict_types=1);

namespace App\MatchCallbackHandler;

use SpomkyLabs\PwaBundle\MatchCallbackHandler\MatchCallbackHandlerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

final readonly class LocalizedPageMatchCallbackHandler implements MatchCallbackHandlerInterface
{
    /**
     * @param list<string> $locales
     */
    public function __construct(
        #[Autowire('%kernel.enabled_locales%')]
        private array $locales,
    ) {
    }

    public function supports(string $matchCallback): bool
    {
        return $matchCallback === 'navigate-or-localized-page';
    }

    public function handle(string $matchCallback): string
    {
        $prefixes = array_map(
            static fn (string $locale): string => '/'.$locale,
            $this->locales,
        );

        return sprintf(
            <<<'JS'
({request, url}) => {
    const localePrefixes = %s;
    const isLocalizedPage = localePrefixes.some(
        (prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)
    );
    if (request.mode !== 'navigate' && !isLocalizedPage) {
        return false;
    }
    const acceptHeader = request.headers.get('Accept') || '';
    if (acceptHeader.includes('text/vnd.turbo-stream.html')) {
        return false;
    }
    if (request.headers.get('Turbo-Frame')) {
        return false;
    }

    return true;
}
JS,
            json_encode($prefixes, JSON_THROW_ON_ERROR),
        );
    }
}
