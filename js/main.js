(function () 
{
    //////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////
    ////    Engine Setup
    //////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////
    class Engine
    {
        constructor ()
        {
            this.frametime = new RunningAverage  ()
            this.rendering = new RenderingEngine (this)
            this.physics   = new PhysicsEngine   (this)
            this.audio     = new AudioEngine     (this)
            this.input     = new InputEngine     (this)
            this.events    = new EventQueue      (this)
            this.scene     = new SnGym           (this)
            this.editor    = new Editor          (this)
            this.update    = () => 
            {
                if (ImagesLoaded.every(v => v) && !this.paused)
                {
                    let start = Date.now()
                    this.input     . startFrame()

                    this.editor    . update()
                    this.scene     . update()
                    this.physics   . update()
                    this.rendering . update()

                    this.input     . endFrame()
                    this.frametime.add(Date.now() - start)
                }
            }

            this.paused = false
         //   document.body.addEventListener('mouseleave', (e) => { this.paused = true })
         //   document.body.addEventListener('mouseenter', (e) => { this.paused = false })
        }
    };

    window.onerror += function (error) 
    {
        document.getElementById("loading").style.color = "#FF4444" 
        document.getElementById("loading").innerHTML += "</br></br>" + error
    }

    const engine = new Engine()

    function loop ()
    {
        engine.update()
        requestAnimationFrame(loop)
    }

    loop()

}())