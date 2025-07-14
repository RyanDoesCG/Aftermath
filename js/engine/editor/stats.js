class Stats
{
    constructor(engine)
    {
        this.engine = engine

        this.latency = new RunningAverage()
    }

    generateHTML()
    {
        this.latency.add((this.engine.input.d))
        var HTML = 
        "<p>" + this.engine.rendering.view.position[0].toFixed(1) + " " + 
                this.engine.rendering.view.position[1].toFixed(1) + " " + 
                this.engine.rendering.view.position[2].toFixed(1) + "</p>" +
        "</br>" +  
        "<p>" + this.engine.rendering.view.rotation[0].toFixed(1) + " " + 
                this.engine.rendering.view.rotation[1].toFixed(1) + " " + 
                this.engine.rendering.view.rotation[2].toFixed(1) + "</p>" +
        "</br>" +  
        "<p>" + (this.engine.frametime.get()).toFixed(1) + "ms CPU</p>"  + 
        "<p>" + this.latency.get().toFixed(1) + "ms GPU</p>"  + 
        "</br>" +  
        "<p>" + (this.engine.rendering.frametime.get()).toFixed(1) + "ms rendering</p>"  + 
        "<p class=\"substat\">" + (this.engine.rendering.basepassFrametime.get()).toFixed(1) + "ms basepass</p>" + 
        "<p class=\"substat\">" + (this.engine.rendering.shadowpassFrametime.get()).toFixed(1) + "ms shadows</p>" + 
        "<p class=\"substat\">" + (this.engine.rendering.lightpassFrametime.get()).toFixed(1) + "ms lighting</p>" + 
        "<p class=\"substat\">" + (this.engine.rendering.volumepassFrametime.get()).toFixed(1) + "ms volumetrics</p>" + 
        "<p class=\"substat\">" + (this.engine.rendering.antialiasingFrametime.get()).toFixed(1) + "ms taa</p>" + 
        "<p class=\"substat\">" + (this.engine.rendering.posteffectsFrametime.get()).toFixed(1) + "ms post process</p>" + 
        "</br>" + 
        "<p>" + (this.engine.physics.frametime.get()).toFixed(1) + "ms physics</p>" +
        "<p class=\"substat\">" + (this.engine.physics.movementFrametime.get()).toFixed(1) + "ms movement</p>" + 
        "<p class=\"substat\">" + (this.engine.physics.collisionNarrowFrametime.get()).toFixed(1) + "ms collision narrow</p>" + 
        "<p class=\"substat\">" + (this.engine.physics.collisionBroadFrametime.get()).toFixed(1) + "ms collision broad</p>" + 
        "<p class=\"substat\">" + (this.engine.physics.integrationFrametime.get()).toFixed(1) + "ms integration</p>" +
        "</br>" + 
        "<p>" + (this.engine.scene.frametime.get()).toFixed(1) + "ms game</p>" +
        "</br>" + 
        "<p>" + (this.engine.editor.frametime.get()).toFixed(1) + "ms editor</p>" + 
         "</br>" + 
        "<p>" + "Press F to enter game</p>" + 
        "</br>" + 
        "<p>" + "Press U to hide stats</p>" 

        document.getElementById("ui").innerHTML = HTML
    }

    update ()
    {
       this.generateHTML()
    }
}