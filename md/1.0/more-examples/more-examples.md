#Getting Started with Cocos2D 3.0


Cocos2D is a framework built upon OpenGL ES 2.0. It is designed for 2D games
and abstracts the manual rendering work involved in OpenGL programming.
It provides you with a clean, simple and native API. In version 3.0 it also comes with SpriteBuilder, a visual editor for Cocos2D games.

Cocos2D provides you with:

* **Scene Management**: games can consist of multiple scenes. Cocos2D provides a simple API to switch between different scenes in your game.
* **Scene Graph Rendering**: In Cocos2D you define the appearance of a scene by adding different nodes (e.g. sprite images) to your scenes.
* **Render Loop & Action System**: Cocos2D provides two different ways to move objects in your scenes. You can either implement the `update` method which is called every frame, or you can use the Cocos2D action system to define movements of objects.
* **Integrated physics engine**: Cocos2D comes with an easy to use physics engine.
* **SpriteBuilder**: a visual designer for Cocos2D games that allows to layout scenes, define animations, etc. 

##What are the basic elements of  a Cocos2D game?
A developer creates a Cocos2D game by creating different scenes. Within these scenes a developer creates a hierarchy of different kinds of nodes. These nodes draw images, colors and text to the screen. Nodes are used to represent all objects in the game, for example a hero and a background image.

The developer will add some movement to the game. This can be done by implementing an `update` method that is called every frame. A developer can also add actions to his game. Actions can be applied to nodes for a variety of animations, for example movements or rotations.

Finally a developer will add some form of interactivity to his game. Mostly he will use the touch system provided by Cocos2D. 

##Basic architecture of a Cocos2D game

On the highest level a Cocos2D game consists of different scenes, represented by the `CCScene` class. A  game can have different scenes for the main menu, the actual gameplay, a leaderboard, just as a UIKit app can have different ViewControllers. 

In Cocos2D a class called `CCDirector` is responsible for managing the active scene and switching between different scenes.

The starting point for your your application - just as for any other iOS application is the `AppDelegate`. In the default Cocos2D template the `AppDelegate` is a subclass of the `CCAppDelegate` that takes care of the basic Cocos2D setup.

The `AppDelegate` also defines the scene that shall initially be displayed by the `CCDirector`  by implementing the `startScene` method.

	-(CCScene *)startScene
	{
		// This method should return the very first scene to be run when your app starts.
		return [IntroScene scene];
	}
	
> Note: Most likely you will not have to change this method. Is automatically setup by SpriteBuilder / the default Cocos2D template.

##Important features discussed in this documentation


- Cocos2D provides an *update* loop. Each `CCNode` subclass can implement the `update:` method that gets called every frame
- Cocos2D provides a per node touch handling. Each `CCNode` subclass can implement `touchBegan:` and other touch handling methods.
- Cocos2D provides a scene management system. A developer can easily define which scene shall be presented and react to the appearing and disappearing of scenes. 
- Cocos2D provides an action system. Actions can be applied to any subclass of `CCNode`. Cocos2D comes with many default `CCAction` subclasses that can be used *out of the box*.
