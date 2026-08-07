<?php

declare(strict_types=1);

namespace App\Controller;

use JsonException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Throwable;
use WebPush\Bundle\Service\WebPush;
use WebPush\Notification;
use WebPush\Subscription;

final class WebPushController extends AbstractController
{
    private const SESSION_KEY = 'symphone.web_push.subscription';

    #[Route('/web-push/subscription', name: 'app_web_push_subscribe', methods: ['POST'])]
    public function subscribe(Request $request): JsonResponse
    {
        try {
            $data = $request->toArray();
            $subscription = $this->createSubscription($data);
        } catch (Throwable $error) {
            return $this->json(['ok' => false, 'message' => $error->getMessage()], 422);
        }

        $request->getSession()->set(self::SESSION_KEY, json_encode($subscription, JSON_THROW_ON_ERROR));

        return $this->json(['ok' => true, 'message' => 'This browser is subscribed.']);
    }

    #[Route('/web-push/subscription', name: 'app_web_push_unsubscribe', methods: ['DELETE'])]
    public function unsubscribe(Request $request): JsonResponse
    {
        $request->getSession()->remove(self::SESSION_KEY);

        return $this->json(['ok' => true, 'message' => 'This browser was unsubscribed.']);
    }

    #[Route('/web-push/send', name: 'app_web_push_send', methods: ['POST'])]
    public function send(
        Request $request,
        #[Autowire(service: 'web_push.service')] WebPush $webPush,
    ): JsonResponse {
        $storedSubscription = $request->getSession()->get(self::SESSION_KEY);
        if (! is_string($storedSubscription) || $storedSubscription === '') {
            return $this->json(['ok' => false, 'message' => 'Subscribe this browser before sending a notification.'], 409);
        }

        try {
            $data = $request->toArray();
            $payload = $this->createPayload($data);
            $notification = Notification::create()
                ->withPayload(json_encode($payload, JSON_THROW_ON_ERROR))
                ->withTTL($this->integer($data, 'ttl', 86400, 0, 2419200))
                ->withUrgency($this->choice($data, 'urgency', ['very-low', 'low', 'normal', 'high'], 'normal'));

            $topic = trim((string) ($data['topic'] ?? ''));
            if ($topic !== '') {
                $notification->withTopic($topic);
            }

            $report = $webPush->send($notification, Subscription::createFromString($storedSubscription));
            if ($report->isSubscriptionExpired()) {
                $request->getSession()->remove(self::SESSION_KEY);

                return $this->json([
                    'ok' => false,
                    'expired' => true,
                    'message' => 'The push service expired this subscription. Subscribe again and retry.',
                ], 410);
            }
            if (! $report->isSuccess()) {
                return $this->json(['ok' => false, 'message' => 'The push service rejected the notification.'], 502);
            }
        } catch (JsonException $error) {
            return $this->json(['ok' => false, 'message' => 'The notification payload could not be encoded.'], 422);
        } catch (Throwable $error) {
            return $this->json(['ok' => false, 'message' => $error->getMessage()], 422);
        }

        return $this->json([
            'ok' => true,
            'message' => 'The encrypted notification was accepted by the browser push service.',
        ]);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function createSubscription(array $data): Subscription
    {
        $endpoint = filter_var($data['endpoint'] ?? null, FILTER_VALIDATE_URL);
        $keys = $data['keys'] ?? null;
        if (! is_string($endpoint) || ! str_starts_with($endpoint, 'https://')) {
            throw new \InvalidArgumentException('A secure push-service endpoint is required.');
        }
        if (! is_array($keys) || ! is_string($keys['auth'] ?? null) || ! is_string($keys['p256dh'] ?? null)) {
            throw new \InvalidArgumentException('The push subscription encryption keys are missing.');
        }

        $subscription = Subscription::create($endpoint)
            ->setKey('auth', $keys['auth'])
            ->setKey('p256dh', $keys['p256dh']);

        $encodings = $data['supportedContentEncodings'] ?? ['aes128gcm'];
        if (is_array($encodings)) {
            $subscription->withContentEncodings(array_values(array_filter($encodings, 'is_string')));
        }

        return $subscription;
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array{title: string, options: array<string, mixed>}
     */
    private function createPayload(array $data): array
    {
        $title = trim((string) ($data['title'] ?? ''));
        if ($title === '' || mb_strlen($title) > 100) {
            throw new \InvalidArgumentException('Enter a notification title of up to 100 characters.');
        }

        $options = [
            'body' => mb_substr(trim((string) ($data['body'] ?? '')), 0, 300),
            'dir' => $this->choice($data, 'dir', ['auto', 'ltr', 'rtl'], 'auto'),
            'lang' => mb_substr(trim((string) ($data['lang'] ?? '')), 0, 35),
            'tag' => mb_substr(trim((string) ($data['tag'] ?? '')), 0, 100),
            'renotify' => (bool) ($data['renotify'] ?? false),
            'requireInteraction' => (bool) ($data['requireInteraction'] ?? false),
            'silent' => (bool) ($data['silent'] ?? false),
            'timestamp' => (int) round(microtime(true) * 1000),
            'data' => [
                'url' => $this->safeDestination((string) ($data['url'] ?? '/')),
                'actionUrls' => [],
            ],
        ];

        foreach (['icon', 'badge', 'image'] as $name) {
            $url = trim((string) ($data[$name] ?? ''));
            if ($url !== '') {
                $options[$name] = $this->safeAssetUrl($url);
            }
        }

        $vibrate = $data['vibrate'] ?? [];
        if (! $options['silent'] && is_array($vibrate)) {
            $options['vibrate'] = array_slice(array_map(
                static fn (mixed $duration): int => max(0, min(10000, (int) $duration)),
                $vibrate,
            ), 0, 20);
        }

        $actions = [];
        foreach (array_slice(is_array($data['actions'] ?? null) ? $data['actions'] : [], 0, 2) as $index => $action) {
            if (! is_array($action)) {
                continue;
            }
            $actionTitle = mb_substr(trim((string) ($action['title'] ?? '')), 0, 40);
            if ($actionTitle === '') {
                continue;
            }
            $id = 'action-'.($index + 1);
            $notificationAction = ['action' => $id, 'title' => $actionTitle];
            $actionIcon = trim((string) ($action['icon'] ?? ''));
            if ($actionIcon !== '') {
                $notificationAction['icon'] = $this->safeAssetUrl($actionIcon);
            }
            $actions[] = $notificationAction;
            $options['data']['actionUrls'][$id] = $this->safeDestination((string) ($action['url'] ?? '/'));
        }
        if ($actions !== []) {
            $options['actions'] = $actions;
        }

        if ($options['tag'] === '') {
            unset($options['tag'], $options['renotify']);
        }
        if ($options['lang'] === '') {
            unset($options['lang']);
        }

        return ['title' => $title, 'options' => $options];
    }

    private function safeAssetUrl(string $url): string
    {
        if (str_starts_with($url, '/')) {
            return $url;
        }
        if (filter_var($url, FILTER_VALIDATE_URL) !== false && str_starts_with($url, 'https://')) {
            return $url;
        }

        throw new \InvalidArgumentException('Notification media must use an HTTPS or root-relative URL.');
    }

    private function safeDestination(string $url): string
    {
        return $this->safeAssetUrl($url === '' ? '/' : $url);
    }

    /**
     * @param array<string, mixed> $data
     * @param string[]            $choices
     */
    private function choice(array $data, string $key, array $choices, string $default): string
    {
        $value = (string) ($data[$key] ?? $default);

        return in_array($value, $choices, true) ? $value : $default;
    }

    /**
     * @param array<string, mixed> $data
     */
    private function integer(array $data, string $key, int $default, int $min, int $max): int
    {
        return max($min, min($max, (int) ($data[$key] ?? $default)));
    }
}
