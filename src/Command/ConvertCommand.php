<?php

namespace App\Command;

use App\Kernel;
use Nette\PhpGenerator\PhpNamespace;
use Nette\PhpGenerator\Type;
use Roave\BetterReflection\SourceLocator\Located\LocatedSource;
use Symfony\Bridge\Twig\Attribute\Template;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Console\Attribute\Argument;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Attribute\Option;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\AutowireIterator;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Roave\BetterReflection\Reflection\ReflectionClass;
// ...

#[AsCommand(name: 'app:convert', description: 'Convert Features and Controllers to a database', help: <<<END
Go through the original controllers and extract the routes, and the metadata in home.html.twig

END
)]
class ConvertCommand
{
    public function __construct(
        #[AutowireIterator(tag: 'controller.service_arguments')] private $taggedServices,
    )
    {

    }
    public function __invoke(
        SymfonyStyle $io,
        #[Argument] ?string $name=null,
        #[Option] ?bool $activate = null,
    ): int
    {
//        $features = $this->getFeaturesFromTwig();
        foreach ($this->taggedServices as $controllerClass) {
            if ($controllerClass::class === Kernel::class) {
                continue;
            }
            $r = ReflectionClass::createFromName($controllerClass::class);
            foreach ($r->getMethods() as $method) {
                $attributes = $method->getAttributes();
                $body = $this->getBody($method->getLocatedSource()->getSource(),
                    $method->getStartLine(), $method->getEndLine());
                dd($body);
            }
            $reflectionClass = new \ReflectionClass($controllerClass);
            foreach ($reflectionClass->getMethods() as $method) {
                foreach ([Route::class] as $routeClass) {
                    foreach ($method->getAttributes($routeClass) as $attribute) {
                        $instance = $attribute->newInstance();
                        switch ($attribute->getName()) {
                            case Route::class:
                                $route = $instance->getName();
                                break;
                            default:
                                dd("@todo: handle " . $attribute->getName());
                        }
                        $args = $attribute->getArguments();
                        $methodName = $method->getName();
                        $name = $args['name'] ?? $methodName;
                        $routes[] = $route;
                    }
                }
            }
        }
        dd($routes);

        return Command::SUCCESS;
    }

    private function getBody($body, $start, $end)
    {
        dd($body, $start, $end);
        return array_slice(explode("\n", $body), $start, $end - $start);

    }

    public function getFeaturesFromTwig(): iterable
    {
        $homeTwig = file_get_contents(getcwd() . '/templates/components/Features.html.twig');
        if (preg_match_all($regex = '|twig:Feature(.*?)/twig:Feature|ims', $homeTwig, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $inner = trim($match[1]);
                foreach (['available','link','title','description'] as $key) {
                    $rx = '/' . $key . '.*?"(.*?)"\n/s';
                    if (preg_match($rx, $inner, $m)) {
                        $values[$key] = $m[1];
                    }
                }
                dd($values);
//                dd('stop', $match[1]);
            }
        } else {
            dd("bad regex: $regex" );
        }

    }

    private function generateClass()
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
            ] as $use
        ) {
            $namespace->addUse($use);
        }
//        dd($namespace->getUses(), $fullInterfaceClass);

        // This name is used for injecting the workflow into a service
// #[Target($class_name::WORKFLOW_NAME)] private WorkflowInterface $workflow
        /*<!--        const WORKFLOW_NAME = '--><?php //= $class_name ?><!--';-->*/


// create new classes in the namespace
        $class = $namespace->addClass('FeatureController');
        foreach (['a'] as $methodName) {
            $method = $class->addMethod('get' . $methodName)
                ->setReturnType(Type::union(Response::class, 'array'));
            $parameter = $method
                ->addParameter('request');
            $parameter
                ->setType(Request::class);

            $method->setBody(sprintf(<<<'PHP'
		/** @var  */ return 'test'
PHP));

            $class->addMethod($methodName);
        }
//        dd((string)$namespace);



    }
}
