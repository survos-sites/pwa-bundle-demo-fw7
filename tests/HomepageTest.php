<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\Attributes\Test;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class HomepageTest extends WebTestCase
{
    #[Test]
    public function theRootControllerRedirectsToTheUserLocale(): void
    {
        //Given
        $client = static::createClient();

        //When
        $crawler = $client->request('GET', '/');

        //Then
        self::assertResponseRedirects('/en_US');
    }

    #[Test]
    public function theHomepageIsVisibleForEveryone(): void
    {
        //Given
        $client = static::createClient();

        //When
        $crawler = $client->request('GET', '/en_US');

        //Then
        self::assertGreaterThan(0, $crawler->filter('html:contains("Symphone")')->count());
    }

    #[Test]
    public function aWebPushSubscriptionCanBeStoredForTheDemoSession(): void
    {
        $client = static::createClient();

        $client->jsonRequest('POST', '/web-push/subscription', [
            'endpoint' => 'https://push.example.test/subscription',
            'keys' => ['auth' => 'auth-key', 'p256dh' => 'public-key'],
            'supportedContentEncodings' => ['aes128gcm'],
        ]);

        self::assertResponseIsSuccessful();
        self::assertJsonStringEqualsJsonString(
            '{"ok":true,"message":"This browser is subscribed."}',
            (string) $client->getResponse()->getContent(),
        );
    }
}
