<?php

namespace App\Controller;

use Symfony\Bridge\Twig\Attribute\Template;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/{_locale<%app.supported_locales_regex%>}')]

class FeaturesController extends AbstractController
{
	#[Route(name: 'app_feature_ar_vr', path: '/ar-vr')]
	public function getArVr(Request $request): Response|array
	{
		return $this->render('features/ar_vr.html.twig');
	}


	#[Route(name: 'app_feature_audio', path: '/audio')]
	public function getAudio(Request $request): Response|array
	{
		return $this->render('features/audio.html.twig');
	}


	#[Route(name: 'app_feature_audio_recording', path: '/audio-recording')]
	public function getAudioRecording(Request $request): Response|array
	{
		return $this->render('features/audio_recording.html.twig');
	}


	#[Route(name: 'app_feature_audio_session', path: '/audio-session')]
	public function getAudioSession(Request $request): Response|array
	{
		return $this->render('features/audio_session.html.twig');
	}


	#[Route(name: 'app_feature_authentication', path: '/authentication')]
	public function getAuthentication(Request $request): Response|array
	{
		return $this->render('features/authentication.html.twig');
	}


	#[Route(name: 'app_feature_background_fetch', path: '/background-fetch')]
	public function getBackgroundFetch(Request $request): Response|array
	{
		return $this->render('features/background_fetch.html.twig');
	}


	#[Route(name: 'app_feature_background_sync', path: '/background-sync')]
	public function getBackgroundSync(Request $request): Response|array
	{
		return $this->render('features/background_sync.html.twig');
	}


	#[Route(name: 'app_feature_barcode_detection', path: '/barcode-detection')]
	public function getBarcodeDetection(Request $request): Response|array
	{
		return $this->render('features/barcode_detection.html.twig');
	}


	#[Route(name: 'app_feature_bluetooth', path: '/bluetooth')]
	public function getBluetooth(Request $request): Response|array
	{
		return $this->render('features/bluetooth.html.twig');
	}


	#[Route(name: 'app_feature_contact_picker', path: '/contact-picker')]
	public function getContactPicker(Request $request): Response|array
	{
		return $this->render('features/contact_picker.html.twig');
	}


	#[Route(name: 'app_feature_device_motion', path: '/device-motion')]
	public function getDeviceMotion(Request $request): Response|array
	{
		return $this->render('features/device_motion.html.twig');
	}


	#[Route(name: 'app_feature_element_capture', path: '/element-capture')]
	public function getElementCapture(Request $request): Response|array
	{
		return $this->render('features/element_capture.html.twig');
	}


	#[Route(name: 'app_feature_face_detection', path: '/face-detection')]
	public function getFaceDetection(Request $request): Response|array
	{
		return $this->render('features/face_detection.html.twig');
	}


	#[Route(name: 'app_feature_file_handling', path: '/file-handling')]
	public function getFileHandling(Request $request): Response|array
	{
		return $this->render('features/file_handling.html.twig');
	}


	#[Route(name: 'app_feature_file_system', path: '/file-system')]
	public function getFileSystem(Request $request): Response|array
	{
		return $this->render('features/file_system.html.twig');
	}


	#[Route(name: 'app_feature_geolocation', path: '/geolocation')]
	public function getGeolocation(Request $request): Response|array
	{
		return $this->render('features/geolocation.html.twig');
	}


	#[Route(name: 'app_feature_i18n', path: '/i18n')]
	public function getI18n(Request $request): Response|array
	{
		return $this->render('features/i18n.html.twig');
	}


	#[Route(name: 'app_feature_installation', path: '/installation')]
	public function getInstallation(Request $request): Response|array
	{
		return $this->render('features/installation.html.twig');
	}


	#[Route(name: 'app_feature_media_capture', path: '/media-capture')]
	public function getMediaCapture(Request $request): Response|array
	{
		return $this->render('features/media_capture.html.twig');
	}


	#[Route(name: 'app_feature_multi_touch', path: '/multi-touch')]
	public function getMultiTouch(Request $request): Response|array
	{
		return $this->render('features/multi_touch.html.twig');
	}


	#[Route(name: 'app_feature_network_info', path: '/network-info')]
	public function getNetworkInfo(Request $request): Response|array
	{
		return $this->render('features/network_info.html.twig');
	}


	#[Route(name: 'app_feature_nfc', path: '/nfc')]
	public function getNfc(Request $request): Response|array
	{
		return $this->render('features/nfc.html.twig');
	}


	#[Route(name: 'app_feature_notifications', path: '/notifications')]
	public function getNotification(Request $request): Response|array
	{
		return $this->render('features/notifications.html.twig');
	}


	#[Route(name: 'app_feature_offline_support', path: '/offline-support')]
	public function getOfflineSupport(Request $request): Response|array
	{
		return $this->render('features/offline_support.html.twig');
	}


	#[Route(name: 'app_feature_orientation', path: '/orientation')]
	public function getOrientation(Request $request): Response|array
	{
		return $this->render('features/orientation.html.twig');
	}


	#[Route(name: 'app_feature_payment', path: '/payment')]
	public function getPayment(Request $request): Response|array
	{
		return $this->render('features/payment.html.twig');
	}


	#[Route(name: 'app_feature_picture_in_picture', path: '/picture-in-picture')]
	public function getPictureInPicture(Request $request): Response|array
	{
		return $this->render('features/picture_in_picture.html.twig');
	}


	#[Route(name: 'app_feature_receiver', path: '/receiver')]
	public function getreceiver(Request $request): Response|array
	{
		return $this->render('features/receiver.html.twig');
	}


	#[Route(name: 'app_feature_protocol_handling', path: '/protocol-handling')]
	public function getProtocolHandling(Request $request): Response|array
	{
		return $this->render('features/protocol_handling.html.twig');
	}


	#[Route(name: 'app_feature_screen_capture', path: '/screen-capture')]
	public function getScreenCapture(Request $request): Response|array
	{
		return $this->render('features/screen_capture.html.twig');
	}


	#[Route(name: 'app_feature_shortcuts', path: '/shortcuts')]
	public function getShortcuts(Request $request): Response|array
	{
		return $this->render('features/shortcuts.html.twig');
	}


	#[Route(name: 'app_feature_speech_recognition', path: '/speech-recognition')]
	public function getSpeechRecognition(Request $request): Response|array
	{
		return $this->render('features/speech_recognition.html.twig');
	}


	#[Route(name: 'app_feature_speech_synthesis', path: '/speech-synthesis')]
	public function getSpeechSynthesis(Request $request): Response|array
	{
		return $this->render('features/speech_synthesis.html.twig');
	}


	#[Route(name: 'app_feature_storage', path: '/storage')]
	public function getStorage(Request $request): Response|array
	{
		return $this->render('features/storage.html.twig');
	}


	#[Route(name: 'app_feature_vibration', path: '/vibration')]
	public function getVibration(Request $request): Response|array
	{
		return $this->render('features/vibration.html.twig');
	}


	#[Route(name: 'app_feature_view_transition', path: '/view-transition')]
	public function getViewTransition(Request $request): Response|array
	{
		return $this->render('features/view_transition.html.twig');
	}


	#[Route(name: 'app_feature_wake_lock', path: '/wake-lock')]
	public function getWakeLock(Request $request): Response|array
	{
		return $this->render('features/wake_lock.html.twig');
	}


	#[Route(name: 'app_feature_web_share', path: '/web-share')]
	public function getWebShare(Request $request): Response|array
	{
		return $this->render('features/web_share.html.twig', [
		            'link' => [
		                "title" =>"What PWA Bundle Can Do Today",
		                "url" => $this->router->generate('app_homepage', [], UrlGeneratorInterface::ABSOLUTE_URL),
		            ],
		            'text' => [
		                "title" =>"What PWA Bundle Can Do Today",
		                "text" =>"Share this page around the world",
		            ],
		        ]);
	}


	#[Route(name: 'survos_command', path: '/run/{commandName}')]
	public function getgetrunCommand(Request $request): Response|array
	{
		//        $commandName = $request->get('commandName');
				        $application = new Application($kernel);
				        $command = $application->get($commandName);

				        chdir($kernel->getProjectDir());

				        /** @var InputDefinition $definition */
				        $definition = $command->getDefinition();

				        // so we can preset some options in the querystring
				        $defaults = $request->query->all();

				//        $option = $definition->getOption('createProjects');
				//        assert($option->getDefault() === true);
				//        dd($command::class, $definition::class);
				        if(isset($defaults['reset'])) {
				            $defaults['reset'] = filter_var($defaults['reset'], FILTER_VALIDATE_BOOLEAN);
				        }
				        if(isset($defaults['dryRun'])) {
				            $defaults['dryRun'] = filter_var($defaults['dryRun'], FILTER_VALIDATE_BOOLEAN);
				        }
				        if(isset($defaults['asMessage'])) {
				            $defaults['asMessage'] = filter_var($defaults['asMessage'], FILTER_VALIDATE_BOOLEAN);
				        }
				        // load from request? for command?
				        foreach (array_merge($definition->getArguments(), $definition->getOptions()) as $cliArgument) {
				            $value = $defaults[$cliArgument->getName()] ?? null;
				            if (!$value) {
				                $defaults[$cliArgument->getName()] = $cliArgument->getDefault();
				            }
				        }

				//        dd($request);

				        $cliString = $commandName;

				        $form = $this->createForm(CommandFormType::class, $defaults, ['command' => $command, 'hasBus' => (bool)$this->bus]);
				        $form->handleRequest($request);
				        $result = '';
				        if ($form->isSubmitted() && $form->isValid()) {
				            $output = new BufferedOutput();

				            $settings = $form->getData();
				            $cli[] = $commandName;
				            foreach ($definition->getArguments() as $cliArgument) {
				                $cli[] = $this->quotify($settings[$cliArgument->getName()]);
				            }
				            foreach ($definition->getOptions() as $cliOption) {
				                $optionName = $cliOption->getName();
				                $value = $settings[$optionName]; // @todo: arrays
				                if ($cliOption->isValueOptional()) {
				                    if ($value) {
				                        $cli[] = '--' . $optionName . ' ' . $this->quotify($value);
				                    }
				                } elseif ($cliOption->isNegatable()) {
				                    if ($value === true) {
				                        $cli[] = '--' . $optionName;
				                    } elseif ($value === false) {
				                        $cli[] = '--no-' . $optionName;
				                    }
				                } else {
				                    if ($value <> '' && !is_bool($value)) {
				                        if (is_array($value)) {
				                            foreach ($value as $valueItem) {
				                                $cli[] = '--' . $optionName . ' ' . $valueItem;
				                            }
				                        } else {
				                            $cli[] = '--' . $optionName . ' ' . $this->quotify($value);
				                        }
				                    } elseif ($value)  {
				                        $cli[] = '--' . $optionName;
				                    }
				                }
				            }

				            $cliString = implode(' ', $cli);
				            if ($form->has('asMessage') && $form->get('asMessage')->getData()) {
				                $envelope = $this->bus->dispatch(new RunCommandMessage($cliString));
				//                dump($envelope);
				                $result = "$cliString dispatched ";
				            } else {
				                    CommandRunner::from($application, $cliString)
				                        ->withOutput($output) // any OutputInterface
				                        ->run();
				//                    dump($output);
				//                try {
				//                } catch (\Exception $exception) {
				////                    dd($cliString, $exception->getMessage());
				//                }
				                $result = $output->fetch();
				            }
				//            try {
				//            } catch (\Exception $exception) {
				////                dd($cliString, $command, $application, $exception->getMessage());
				//            }

				//                CommandRunner::for($command, 'Bob p@ssw0rd --role ROLE_ADMIN')->run(); // works great
				        }

				//        CommandRunner::from($application, 'my:command --help')
				//            ->run();
				//
				//        CommandRunner::for($command, '--help')->run(); // fails, says --help isn't defined

				        return $this->render('@SurvosCommand/run.html.twig', [
				            'base' => $this->config['base_layout'],
				            'cliString' => $cliString,
				            'form' => $form->createView(),
				            'result' => $result,
				            'command' => $command
				        ]);
	}


	#[Route(name: 'f7_app_partial_tab_share_html', path: '/partials/tab-share.html')]
	public function getf7_app_partial_tab_share_html(Request $request): Response|array
	{
		return $this->render('/partials/tab-share.html.twig');
	}


	#[Route(name: 'app_information', path: '/information')]
	public function getInformation(Request $request): Response|array
	{
		return $this->render('information/index.html.twig');
	}


	#[Route(name: 'app_protocol_handler', path: '/handler')]
	public function getProtocolHandler(Request $request): Response|array
	{
		return match (true) {
		            str_starts_with($request->query->get('type'), 'web+pwabundle://geolocation') => $this->redirectToRoute('app_feature_geolocation'),
		            str_starts_with($request->query->get('type'), 'web+pwabundle://screen-capturing') => $this->redirectToRoute('app_feature_screen_capture'),
		            default => throw $this->createNotFoundException(),
		        };
	}


	#[Route(name: 'app_root', path: '/')]
	public function getRoot(Request $request): Response|array
	{
		$locale =
		            $request->attributes->get('_locale') ??
		            $request->getSession()
		                ->get('_locale') ??
		            $request->getPreferredLanguage($this->supportedLocales) ??
		            $this->defaultLocale
		        ;


		        return $this->redirectToRoute('app_homepage', [
		            '_locale' => $locale,
		        ], Response::HTTP_SEE_OTHER);
	}


	#[Route(name: 'survos_command', path: '/run/{commandName}')]
	public function getrunCommand(Request $request): Response|array
	{
		//        $commandName = $request->get('commandName');
		        $application = new Application($kernel);
		        $command = $application->get($commandName);

		        chdir($kernel->getProjectDir());

		        /** @var InputDefinition $definition */
		        $definition = $command->getDefinition();

		        // so we can preset some options in the querystring
		        $defaults = $request->query->all();

		//        $option = $definition->getOption('createProjects');
		//        assert($option->getDefault() === true);
		//        dd($command::class, $definition::class);
		        if(isset($defaults['reset'])) {
		            $defaults['reset'] = filter_var($defaults['reset'], FILTER_VALIDATE_BOOLEAN);
		        }
		        if(isset($defaults['dryRun'])) {
		            $defaults['dryRun'] = filter_var($defaults['dryRun'], FILTER_VALIDATE_BOOLEAN);
		        }
		        if(isset($defaults['asMessage'])) {
		            $defaults['asMessage'] = filter_var($defaults['asMessage'], FILTER_VALIDATE_BOOLEAN);
		        }
		        // load from request? for command?
		        foreach (array_merge($definition->getArguments(), $definition->getOptions()) as $cliArgument) {
		            $value = $defaults[$cliArgument->getName()] ?? null;
		            if (!$value) {
		                $defaults[$cliArgument->getName()] = $cliArgument->getDefault();
		            }
		        }

		//        dd($request);

		        $cliString = $commandName;

		        $form = $this->createForm(CommandFormType::class, $defaults, ['command' => $command, 'hasBus' => (bool)$this->bus]);
		        $form->handleRequest($request);
		        $result = '';
		        if ($form->isSubmitted() && $form->isValid()) {
		            $output = new BufferedOutput();

		            $settings = $form->getData();
		            $cli[] = $commandName;
		            foreach ($definition->getArguments() as $cliArgument) {
		                $cli[] = $this->quotify($settings[$cliArgument->getName()]);
		            }
		            foreach ($definition->getOptions() as $cliOption) {
		                $optionName = $cliOption->getName();
		                $value = $settings[$optionName]; // @todo: arrays
		                if ($cliOption->isValueOptional()) {
		                    if ($value) {
		                        $cli[] = '--' . $optionName . ' ' . $this->quotify($value);
		                    }
		                } elseif ($cliOption->isNegatable()) {
		                    if ($value === true) {
		                        $cli[] = '--' . $optionName;
		                    } elseif ($value === false) {
		                        $cli[] = '--no-' . $optionName;
		                    }
		                } else {
		                    if ($value <> '' && !is_bool($value)) {
		                        if (is_array($value)) {
		                            foreach ($value as $valueItem) {
		                                $cli[] = '--' . $optionName . ' ' . $valueItem;
		                            }
		                        } else {
		                            $cli[] = '--' . $optionName . ' ' . $this->quotify($value);
		                        }
		                    } elseif ($value)  {
		                        $cli[] = '--' . $optionName;
		                    }
		                }
		            }

		            $cliString = implode(' ', $cli);
		            if ($form->has('asMessage') && $form->get('asMessage')->getData()) {
		                $envelope = $this->bus->dispatch(new RunCommandMessage($cliString));
		//                dump($envelope);
		                $result = "$cliString dispatched ";
		            } else {
		                    CommandRunner::from($application, $cliString)
		                        ->withOutput($output) // any OutputInterface
		                        ->run();
		//                    dump($output);
		//                try {
		//                } catch (\Exception $exception) {
		////                    dd($cliString, $exception->getMessage());
		//                }
		                $result = $output->fetch();
		            }
		//            try {
		//            } catch (\Exception $exception) {
		////                dd($cliString, $command, $application, $exception->getMessage());
		//            }

		//                CommandRunner::for($command, 'Bob p@ssw0rd --role ROLE_ADMIN')->run(); // works great
		        }

		//        CommandRunner::from($application, 'my:command --help')
		//            ->run();
		//
		//        CommandRunner::for($command, '--help')->run(); // fails, says --help isn't defined

		        return $this->render('@SurvosCommand/run.html.twig', [
		            'base' => $this->config['base_layout'],
		            'cliString' => $cliString,
		            'form' => $form->createView(),
		            'result' => $result,
		            'command' => $command
		        ]);
	}
}
