<?php

namespace App\Command;

use App\Kernel;
use Nette\PhpGenerator\PhpNamespace;
use Nette\PhpGenerator\Type;
use Roave\BetterReflection\Reflection\ReflectionClass;
use Symfony\Bridge\Twig\Attribute\Template;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\DependencyInjection\Attribute\AutowireIterator;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Zenstruck\Console\Attribute\Option;
use Zenstruck\Console\InvokableServiceCommand;
use Zenstruck\Console\IO;
use Zenstruck\Console\RunsCommands;
use Zenstruck\Console\RunsProcesses;
use function Symfony\Component\String\u;

#[AsCommand('app:process', 'same as app:convert, but with zenstruck')]
final class AppProcessCommand extends InvokableServiceCommand
{
    use RunsCommands;
    use RunsProcesses;

    public function __construct(
        #[AutowireIterator(tag: 'controller.service_arguments')] private $taggedServices,
    )
    {
        parent::__construct();

    }

    public function __invoke(
        IO   $io,

        #[Option(description: 'overwrite the commands even if they exist')]
        bool $force = true,
    ): int
    {

        $methods = [];
        //        $features = $this->getFeaturesFromTwig();
//        dd(iterator_to_array($this->taggedServices));
        foreach ($this->taggedServices as $controllerClass) {
            // we're only converting the methods is \\Feature controllers
            if (!str_contains($controllerClass::class, '\\Feature\\')) {
                continue;
            }
            if ($controllerClass::class === Kernel::class) {
                continue;
            }
//            $body = [];
//            $r = ReflectionClass::createFromName($controllerClass::class);
//            foreach ($r->getMethods() as $method) {
//                dd($method->)
////                $attributes = $method->getAttributes();
//
//                $reflectionClass = new \ReflectionClass($controllerClass::class);
//                $refMethod  = $reflectionClass->getMethod($method->getName());
//                dd($refMethod->getStartLine(), $method->getStartLine());
//                $innerBody = $this->getBody($method->getLocatedSource()->getSource(),
//                    $refMethod->getStartLine(), $refMethod->getEndLine());
//
//
//                $outerBody = $this->getBody($method->getLocatedSource()->getSource(),
//                    $method->getStartLine(), $method->getEndLine());
////                if ($method->getName() === '_invoke') {
//                    $body[$reflectionClass->getShortName()] = $innerBody;
////                }
////                dd($innerBody, $outerBody);
//            }
//            dd($body);

            $betterReflectionClass = ReflectionClass::createFromName($controllerClass::class);
            $reflectionClass = new \ReflectionClass($controllerClass);
            foreach ($betterReflectionClass->getMethods() as $betterMethod) {
                // native!
                $refMethod  = (new \ReflectionClass($controllerClass::class))
                    ->getMethod($betterMethod->getName());
                $name = $betterMethod->getName();
                if ($name === '__invoke') {
                    $name = u($reflectionClass->getShortName())->before('Controller')->toString();
                }
                $innerBody = $this->getBody($betterMethod->getLocatedSource()->getSource(),
                    $refMethod->getStartLine(), $refMethod->getEndLine());
//                $name == 'AudioRecording' && dd($innerBody, $refMethod);

//                dd($method->getName(), $innerBody);

                foreach ([Route::class] as $routeClass) {
                    foreach ($refMethod->getAttributes($routeClass) as $attribute) {
                        $instance = $attribute->newInstance();
                        switch ($attribute->getName()) {
                            case Route::class:
                                $route = $instance->getName();
                                break;
                            default:
                                dd("@todo: handle " . $attribute->getName());
                        }
                        $args = $attribute->getArguments();
                        $methodName = $refMethod->getName();
//                        $name = $args['name'] ?? $methodName;
                        $routes[] = $route;
                        $methods[$betterReflectionClass->getShortName()] = [
                            'route' => $instance,
                            'name' => $name,
                            'body' => join("\n", $innerBody),
                        ];
                    }
                }
            }
        }
        $controller = $this->generateClass($methods);
        dd($controller);
        file_put_contents('src/Controller/FeaturesController.php', "<?php\n\n" . $controller);
        dd($controller, $methods);

        return Command::SUCCESS;
    }

    private function getBody($body, $start, $end)
    {
        return array_slice(explode("\n", $body), $start, $end - $start);

    }

    public function getFeaturesFromTwig(): iterable
    {
        $homeTwig = file_get_contents(getcwd() . '/templates/components/Features.html.twig');
        if (preg_match_all($regex = '|twig:Feature(.*?)/twig:Feature|ims', $homeTwig, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $inner = trim($match[1]);
                foreach (['available', 'link', 'title', 'description'] as $key) {
                    $rx = '/' . $key . '.*?"(.*?)"\n/s';
                    if (preg_match($rx, $inner, $m)) {
                        $values[$key] = $m[1];
                    }
                }
                dd($values);
//                dd('stop', $match[1]);
            }
        } else {
            dd("bad regex: $regex");
        }

    }

    private function generateClass(array $methods): string
    {
        $ns = "App\\Controller";
        $namespace = new PhpNamespace($ns);
        foreach (
            [
                AbstractController::class,
                Route::class,
                Template::class,
                Request::class,
                Response::class,
                AbstractController::class
            ] as $use
        ) {
            $namespace->addUse($use);
        }
//        dd($namespace->getUses(), $fullInterfaceClass);

        // This name is used for injecting the workflow into a service
// #[Target($class_name::WORKFLOW_NAME)] private WorkflowInterface $workflow
        /*<!--        const WORKFLOW_NAME = '--><?php //= $class_name ?><!--';-->*/


// create new classes in the namespace
        $class = $namespace->addClass('FeaturesController');
        $class->addAttribute(Route::class, [
            '/{_locale<%app.supported_locales_regex%>}'
        ]);
        $class->setExtends(AbstractController::class);
        foreach ($methods as $m) {
            $route = $m['route'];

            $body = trim($m['body']);
            $body = trim($body, '{');
            $body = trim($body, '}');

            if (preg_match('|features/(.*?).html.twig|', $body, $urlMatches)) {
                $twigCode = $urlMatches[1];
//                assert("/$twigCode" == $route->getPath(), "$twigCode {$route->getPath()} should match");
//                dd($m, $body, $urlMatches, $route->getPath(), $route->getName(), $twigCode);
            }

            $methodName = $m['name'];


            dd($body, $methodName);
            $method = $class->addMethod('get' . $methodName)
                ->setReturnType(Type::union(Response::class, 'array'));
            $parameter = $method
                ->addParameter('request');
            $parameter
                ->setType(Request::class);
            $method->addAttribute(Route::class, [ $route->getPath(), $route->getName(), ['options' => ['expose' => true]]]);
            // trim the {}


            $method->setBody($body);
//            $methodName == 'ArVr' && dd($m, $method, (string)$namespace);
        }
        return (string)$namespace;


    }
}
