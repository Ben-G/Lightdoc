# Custom Rendering and Drawing in Cocos2D 3.1
*This entire chapter is written and provided by Scott Lembcke. Thanks a lot!*

  



There are 3 main ways to extend the rendering in Cocos2D.

You can create a custom drawing methods to draw something that is more than a simple sprite. This is probably the easiest way to extend Cocos2D rendering since you don't need to know a lot about OpenGL. You just need to describe a shape using vertexes (position, texture position, color) and then make those vertexes into a bunch of triangles.

You can apply custom shaders using GLSL. You will need to learn about how OpenGL shaders work (vertex shaders optional), and this guide can't cover that. There are plans to make a shader tutorial app soon though. Shaders and custom drawing functions can be mixed of course for best results.

Lastly, you can extend Cocos2D with arbitrary OpenGL ES 2 code. This is certainly an advanced topic. This guide assumes you already know OpenGL if you intend to use this feature.


## Custom CCNode Drawing methods:

Here is an example of almost everything you need to know about how to do custom rendering in Cocos2D v3.1. If this looks scary, remember that it's mostly comments. The actual draw method for CCSprite is just a few lines of code! Extending this snippet to render terrain or other custom shapes should be pretty straightforward once you get the hang of working with vertexes and triangles.


	@interface CustomSprite : CCNode<CCShaderProtocol, CCTextureProtocol>
	@end
	
	@implementation CustomSprite
	
	-(id)init
	{
		if((self = [super init])){
			// Set up a texture for rendering.
			// If you want to mix several textures, you need to make a shader and use CCNode.shaderUniforms.
			self.texture = [CCTexture textureWithFile:@"Tiles/05.png"];
			
			// Set a builtin shader that draws the node with a texture.
			// The default shader only draws the color of a node, ignoring it's texture.
			self.shader = [CCShader positionTextureColorShader];
		}
		
		return self;
	}
	
	-(void)draw:(CCRenderer *)renderer transform:(const GLKMatrix4 *)transform
	{
		// What we want to do here is draw the texture from (0, 0) to (width, height) in the node's coordinates like a regular sprite.
		
		// 1) First we should check if our sprite will be onscreen or not, though this step is not required.
		// Given a bounding box in node coordinates and the node's transform, CCRenderCheckVisbility() can figure that out for us.
		
		// CCRenderCheckVisbility() takes an axis aligned bounding box expressed as a center and extents.
		// "extents" just means half the width and height of the bounding box.
		
		// Normally you'd want to do this outside of the draw method, but I'm trying to keep everything together.
		CGSize size = self.texture.contentSize;
		
		// The center and extents are easy to calculate in this case.
		// They are actually the same value in this case, but that won't normally be true.
		GLKVector2 center = GLKVector2Make(size.width/2.0, size.height/2.0);
		GLKVector2 extents = GLKVector2Make(size.width/2.0, size.height/2.0);
		
		// Now we just need to check if the sprite is visible.
		if(CCRenderCheckVisbility(transform, center, extents)){
			// 2) Now we can request a buffer from the renderer with enough space for 2 triangles and 4 vertexes.
			// Why two triangles instead of a rectangle? Modern GPUs really only draw triangles (and really bad lines/circles).
			// To draw a "fancy" shape like a rectangle to put our sprite on, we need to split it into two triangles.
			// self.renderState encapsulates the shader, shader uniforms, textures and blending modes set for this node.
			// You aren't required to pass self.renderState if you want to do something else.
			// Global sort order allows you to reorder draw calls, but this is a topic for its own article. The default value is always 0.
			CCRenderBuffer buffer = [renderer enqueueTriangles:2 andVertexes:4 withState:self.renderState globalSortOrder:0];
			
			// 3) Next we make some vertexes to fill the buffer with. We need to make one for each corner of the sprite.
			// There are easier/shorter ways to fill in a CCVertex (See CCSprite.m for example), but this way is easy to read.
			
			CCVertex bottomLeft;
			// This is the position of the vertex in the node's coordinates.
			// Why are there 4 coordinates if this is a Cocos ->2D<- ?
			// You can probably guess, that the first two numbers are the x and y coordinates.
			// The 3rd is the z-coordinate in case you want to do 3D effects.
			// Always set the 4th coordinate to 1.0. (Google for "homogenous coordinates" if you want to learn what it is)
			bottomLeft.position = GLKVector4Make(0.0, 0.0, 0.0, 1.0);
			// This is the position of the vertex relative to the texture in normalized coordinates.
			// (0, 0) is the top left corner and (1, 1) is the bottom right.
			// This is actually upside down compared to the OpenGL convention.
			bottomLeft.texCoord1 = GLKVector2Make(0.0, 1.0);
			// Lastly we need to set a "pre-multiplied" RGBA color.
			// Premultiplied means that the RGB components have been multiplied by the alpha.
			bottomLeft.color = GLKVector4Make(1.0, 1.0, 1.0, 1.0);
			
			// Now we are almost ready to put the vertex into the buffer, but there is one last step.
			// The positions of the vertexes need to be screen relative (OpenGL clip coordinates), but we made them node relative!
			// Fortunately, that's what the 'transform' variable is for. It lets you convert from node to screen coordinates.
			// CCVertexApplyTransform() will apply a transformation to an existing vertex's position.
			// Then we just need to use CCRenderBufferSetVertex() to store the vertex at index 0.
			CCRenderBufferSetVertex(buffer, 0, CCVertexApplyTransform(bottomLeft, transform));
			
			// Now to fill in the other 3 vertexes the same way.
			CCVertex bottomRight;
			bottomRight.position = GLKVector4Make(0.0, size.width, 0.0, 1.0);
			bottomRight.texCoord1 = GLKVector2Make(1.0, 1.0);
			bottomRight.color = GLKVector4Make(1.0, 1.0, 1.0, 1.0);
			CCRenderBufferSetVertex(buffer, 1, CCVertexApplyTransform(bottomRight, transform));
			
			CCVertex topRight;
			topRight.position = GLKVector4Make(size.height, size.width, 0.0, 1.0);
			topRight.texCoord1 = GLKVector2Make(1.0, 0.0);
			topRight.color = GLKVector4Make(1.0, 1.0, 1.0, 1.0);
			CCRenderBufferSetVertex(buffer, 2, CCVertexApplyTransform(topRight, transform));
			
			CCVertex topLeft;
			topLeft.position = GLKVector4Make(size.height, 0.0, 0.0, 1.0);
			topLeft.texCoord1 = GLKVector2Make(0.0, 0.0);
			topLeft.color = GLKVector4Make(1.0, 1.0, 1.0, 1.0);
			CCRenderBufferSetVertex(buffer, 3, CCVertexApplyTransform(topLeft, transform));
			
			// 4) Now that we are all done filling in the vertexes, we just need to make triangles with them.
			// This is pretty easy. The first number is the index of the triangle we are setting.
			// The last three numbers are the indexes of the vertexes set using CCRenderBufferSetVertex() to use for the corners.
			CCRenderBufferSetTriangle(buffer, 0, 0, 1, 2);
			CCRenderBufferSetTriangle(buffer, 1, 0, 2, 3);
		}
	}
	
	@end


Of course you don't need to be this verbose, nor do you need to calculate everything in the draw method. CCSprite's draw method precalculates the vertex information and contains a much simpler draw method:


	-(void)draw:(CCRenderer *)renderer transform:(const GLKMatrix4 *)transform;
	{
		if(!CCRenderCheckVisbility(transform, _vertexCenter, _vertexExtents)) return;
		
		CCRenderBuffer buffer = [renderer enqueueTriangles:2 andVertexes:4 withState:self.renderState globalSortOrder:0];
		CCRenderBufferSetVertex(buffer, 0, CCVertexApplyTransform(_verts.bl, transform));
		CCRenderBufferSetVertex(buffer, 1, CCVertexApplyTransform(_verts.br, transform));
		CCRenderBufferSetVertex(buffer, 2, CCVertexApplyTransform(_verts.tr, transform));
		CCRenderBufferSetVertex(buffer, 3, CCVertexApplyTransform(_verts.tl, transform));
		
		CCRenderBufferSetTriangle(buffer, 0, 0, 1, 2);
		CCRenderBufferSetTriangle(buffer, 1, 0, 2, 3);
	...


## Custom Shaders:

Shaders are much simpler to use in v3.1 compared to previous versions. While this section is aimed at novice shader users, hopefully we can make something for beginners soon too.

First of all, you'll want to skim in `CCShader.m` at the "shader header" strings. These are appended on to the beginning of your programs to add some builtin variables (Don't worry, unused variables don't cause any overhead). These include things such as the current time, per-frame random numbers, the screen size, etc. The builtin vertex attributes are already defined for you as well as varyings to pass them onto the fragment shader. There is also a default vertex shader that basically just copies the attribute values to the varyings. This is almost certainly what you'd want to do anyway.

The easiest way to load your shaders is using `[CCShader shaderNamed:@"MyGreatShader"]`. This will look for a file named `MyGreatShader.fsh` for your fragment shader, and optionally a file named `MyGreatShader.vsh` for your vertex shader. If you don't have a vertex shader file, the default Cocos2D vertex shader will be used. Shaders created this way will be cached so it doesn't have to be loaded again.

You can also embed them in your code using `NSStrings`. Shaders created this way cannot be cached. Make sure you don't create a lot of duplicates! You can also embed your GLSL strings in your source using the `CC_GLSL` macro. It's easier to read but harder to debug since the C preprocessor will cram it all into one line. It's nicest when the shader is only a few lines long. Example:

```
CC_SHADER_POS_TEX_COLOR_ALPHA_TEST = [[self alloc] initWithFragmentShaderSource:CC_GLSL(
	uniform float cc_AlphaTestValue;
	void main(){
		vec4 tex = texture2D(cc_MainTexture, cc_FragTexCoord1);
		if(tex.a <= cc_AlphaTestValue) discard;
		gl_FragColor = cc_FragColor*tex;
	}
)];
```

The next thing you'll want to do with shaders is pass values for your shader uniforms. There are two ways you can do it. If you want a bunch of shaders to share the same uniform values you can set a uniform value in the global dictionary. The key is the same as the uniform's name. The value needs to be some sort of object (`NSNumber`, `NSValue`, `CCColor`, `CCTexture`, etc). For instance, say you want to set cc_AlphaTestValue value to 0.5 for all nodes:

```
[CCDirector sharedDirector].globalShaderUniforms[@"cc_AlphaTestValue"] = @(0.5);
```

CCNodes also have their own shader uniform dictionary. You can use these to set specific values for specific nodes or to override the global uniforms. Be aware that setting node specific uniform values makes them unbatchable.

```
mosterSprite.shaderUniforms[@"pointSize"] = [NSValue valueWithCGSize:CGSizeMake(10, 10)];
```

Currently the following GLSL uniform types are supported:

GLSL Type | Expected Obj-C Type
--- | ---
`float` | `NSNumber`
`vec2` | `[NSValue valueWithCGPoint:]`, `[NSValue valueWithCGSize:]`, `[NSValue valueWithGLKVector2:`
`vec3` | `[NSValue valueWithGLKVector3:]`
`vec4` | `[NSValue valueWithGLKVector4:]`, `CCColor`
`mat4` | `[NSValue valueWithGLKMat4:]`
`sampler2D` | `CCTexture`

## Custom OpenGL Code:

In order to perform automatic batching, the Cocos2D renderer will queue up several draw calls before executing them. This means that in order to execute arbitrary GL code, you must register it with the render queue so it will be executed at the right time. You can either wrap this code in a block or a method. The global sort order allows you to reorder drawing commands, but the default value is always 0. Sorting order is a topic for its own article later perhaps. The debug label is displayed in Xcode's GLES debugger. If your block is thread safe, you can tell the renderer that. The threaded renderer is not yet implemented in 3.1 and the flag is currently ignored.


	[renderer enqueueBlock:^{
		glColorMask(GL_FALSE, GL_FALSE, GL_FALSE, GL_TRUE);
	} globalSortOrder:0 debugLabel:@"Set alpha only color writes." threadSafe:NO];
	
	[renderer enqueueMethod:@selector(myAwesomeMethod) target:self];


You can generally modify whatever GL state you want. If you change the texture state, blending mode or shader bindings, you'll need to call `[CCRenderer invalidateState]` to let the renderer know that its cache is no longer correct. Other than that, the renderer uses VAOs to manage it's vertex state. Some states such as clear values are set each time they are used. Other states such as the stencil or z-testing modes are purposefully ignored. For instance, you might want to override `[CCNode visit:parentTransform:]` to enable scissor testing before visiting its children and then disable it again afterwards.

One mild change that might happen before 3.1 is officially released is to add a parameter signifying that your block or method is threadsafe.

##See Also

- [Shader Cookbook by Scott Lembcke](https://github.com/slembcke/Cocos2DShaderCookbook) 