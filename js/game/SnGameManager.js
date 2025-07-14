class SnGameManager extends SceneObject
{
    constructor(params)
    {
        params.transform = new Transform(Scale(1.0, 1.0, 1.0), Translation(0.0, 0.0, 0.0), Rotation(0.0, 0.0, 0.0))
        super(params)

        this.introPlaying = 0
        this.gamePlaying = 1
        this.outroPlaying = 2

        this.state = 0

        this.splashScreenOpacity = 2.0  
        document.getElementById("splash").style.opacity = this.splashScreenOpacity;

        this.introFlashHappened = false
    }

    update (engine)
    {
        const postprocessor = engine.scene.getPostProcessObject()
        const character = engine.scene.find("Character")
        if (character)
        {
            if (this.state == this.introPlaying)
            {
                this.splashScreenOpacity = Math.max(this.splashScreenOpacity - 0.02, 0.0)
                document.getElementById("splash").style.opacity = this.splashScreenOpacity;
    
                if (this.splashScreenOpacity >= 0.25)
                {
    
                    this.state = this.gamePlaying
                }
            }
    
            if (this.state == this.gamePlaying)
            {
                this.splashScreenOpacity = Math.max(this.splashScreenOpacity - 0.02, 0.0)
                document.getElementById("splash").style.opacity = this.splashScreenOpacity;
                character.freeze = false
    
                postprocessor.material.uniforms.get("health").value = character.health;
    
                if (character.health <= 0.0)
                {
                    this.state = this.outroPlaying
                }
            }
    
            if (this.state == this.outroPlaying)
            {
                this.splashScreenOpacity += 0.02
                document.getElementById("splash").style.opacity = this.splashScreenOpacity;
                document.getElementById("splashText").style.opacity = 0.0
    
                if (this.splashScreenOpacity >= 1.0)
                {
                    engine.scene.begin()
                }
            }
        }
    }
}