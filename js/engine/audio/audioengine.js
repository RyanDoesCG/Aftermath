class AudioEngine
{
    constructor(engine)
    {
        this.engine = engine

        const al = new AudioContext();

        log ("Audio: " + al)

        this.sounds = new Map()
    }

    requestSound(name, params)
    {
        /*
        this.sounds.set(name, new Audio("sounds/" + name + ".wav"))

        if (params)
        {
            this.sounds.get(name).loop = params.loop
        }
        */
    }

    playSound(name)
    {
        /*
        //log ("Audio: playing " + name)
        if (this.sounds.has(name))
        {
            this.sounds.get(name).play()
        }
        */
    }
    
    stopSound(name)
    {
        /*
        if (this.sounds.has())
        {
            this.sounds.get(name).pause() 
        }
        */
    }

    update()
    {

    }
}