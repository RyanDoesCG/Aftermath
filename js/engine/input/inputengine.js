class InputEngine
{
    constructor(engine)
    {
        this.engine = engine

        this.canvas = document.getElementById('viewport')

        this.APressed = false
        this.BPressed = false
        this.CPressed = false
        this.DPressed = false
        this.EPressed = false
        this.FPressed = false
        this.GPressed = false
        this.HPressed = false
        this.IPressed = false
        this.JPressed = false
        this.KPressed = false
        this.LPressed = false
        this.MPressed = false
        this.NPressed = false
        this.OPressed = false
        this.PPressed = false
        this.QPressed = false
        this.RPressed = false
        this.SPressed = false
        this.TPressed = false
        this.UPressed = false
        this.VPressed = false
        this.WPressed = false
        this.XPressed = false
        this.YPressed = false
        this.ZPressed = false
        
        /*
        this.WPressed = false;
        this.SPressed = false;
        this.QPressed = false;
        this.EPressed = false;
        this.FPressed = false;
        this.UPressed = false;
        this.CPressed = false;
        this.XPressed = false;
        this.ZPressed = false;
        this.VPressed = false;
        this.LPressed = false;
        */

        this.LeftArrowPressed = false;
        this.RightArrowPressed = false;
        this.UpArrowPressed = false;
        this.DownArrowPressed = false;
        this.ShiftPressed = false;
        this.SpacePressed = false;
        this.CmdPressed   = false;
        this.BackspacePressed = false;

        this.leftMouseClicked = 0
        this.rightMouseClicked = 0
        this.leftMouseHeld = 0
        this.rightMouseHeld = 0
        this.mouseX = 0
        this.mouseY = 0

        this.mouseChangeX = 0
        this.mouseChangeY = 0

        this.time = 0.0
        this.d = 0.0

        document.addEventListener('keyup',   this.keyUp.bind(this), true)
        document.addEventListener('keydown', this.keyDown.bind(this), true)

        this.canvas.addEventListener('mousemove', this.mouse.bind(this), true)
        this.canvas.addEventListener('mousedown', this.clickDown.bind(this), true)
        this.canvas.addEventListener('mouseup', this.clickUp.bind(this), true)
    }

    mouse (event)
    {
        var bounds = event.target.getBoundingClientRect();

        this.mouseX = ((event.clientX - bounds.left) / this.canvas.clientWidth ) * this.canvas.width;
        this.mouseY = ((1.0 - (event.clientY - bounds.top)  / this.canvas.clientHeight)) * this.canvas.height;

        this.mouseChangeX = event.movementX
        this.mouseChangeY = event.movementY
    }

    clickDown (event)
    {
        if (event.button == 0)
        {
            this.leftMouseClicked = true
        }

        if (event.button == 2)
        {
            event.preventDefault()
            this.rightMouseClicked = true
        }

    }

    clickUp (event)
    {
        if (event.button == 0)
        {
            this.leftMouseHeld = false
        }

        if (event.button == 2)
        {
            this.rightMouseHeld = false
        }
    }

    keyDown (event)
    {
        event.preventDefault()

        if (!event.repeat)
        {
            if      (event.key == 'a' || event.key == 'A') this.APressed = true
            else if (event.key == 'b' || event.key == 'B') this.BPressed = true
            else if (event.key == 'c' || event.key == 'C') this.CPressed = true
            else if (event.key == 'd' || event.key == 'D') this.DPressed = true
            else if (event.key == 'e' || event.key == 'E') this.EPressed = true
            else if (event.key == 'f' || event.key == 'F') this.FPressed = true
            else if (event.key == 'g' || event.key == 'G') this.GPressed = true
            else if (event.key == 'h' || event.key == 'H') this.HPressed = true
            else if (event.key == 'i' || event.key == 'I') this.IPressed = true
            else if (event.key == 'j' || event.key == 'J') this.JPressed = true
            else if (event.key == 'k' || event.key == 'K') this.KPressed = true
            else if (event.key == 'l' || event.key == 'L') this.LPressed = true
            else if (event.key == 'm' || event.key == 'M') this.MPressed = true
            else if (event.key == 'n' || event.key == 'N') this.NPressed = true
            else if (event.key == 'o' || event.key == 'O') this.OPressed = true
            else if (event.key == 'p' || event.key == 'P') this.PPressed = true
            else if (event.key == 'q' || event.key == 'Q') this.QPressed = true
            else if (event.key == 'r' || event.key == 'R') this.RPressed = true
            else if (event.key == 's' || event.key == 'S') this.SPressed = true
            else if (event.key == 't' || event.key == 'T') this.TPressed = true
            else if (event.key == 'u' || event.key == 'U') this.UPressed = true
            else if (event.key == 'v' || event.key == 'V') this.VPressed = true
            else if (event.key == 'w' || event.key == 'W') this.WPressed = true
            else if (event.key == 'x' || event.key == 'X') this.XPressed = true
            else if (event.key == 'y' || event.key == 'Y') this.YPressed = true
            else if (event.key == 'z' || event.key == 'Z') this.ZPressed = true

            else if (event.key == ' ') this.SpacePressed = true
            else if (event.key == 'Backspace') this.BackspacePressed = true
            else if (event.key == 'ArrowLeft')  { this.LeftArrowPressed  = true; event.preventDefault();}
            else if (event.key == 'ArrowRight') { this.RightArrowPressed = true; event.preventDefault();}
            else if (event.key == 'ArrowUp')    { this.UpArrowPressed    = true; event.preventDefault();} 
            else if (event.key == 'ArrowDown')  { this.DownArrowPressed  = true; event.preventDefault();}
            else if (event.key == 'Shift') this.ShiftPressed = true
        }

        if (event.metaKey) this.CmdPressed = true
    }

    keyUp (event)
    {
        event.preventDefault()
        
        if (!event.repeat)
        {
            if      (event.key == 'a' || event.key == 'A') this.APressed = false
            else if (event.key == 'b' || event.key == 'B') this.BPressed = false
            else if (event.key == 'c' || event.key == 'C') this.CPressed = false
            else if (event.key == 'd' || event.key == 'D') this.DPressed = false
            else if (event.key == 'e' || event.key == 'E') this.EPressed = false
            else if (event.key == 'f' || event.key == 'F') this.FPressed = false
            else if (event.key == 'g' || event.key == 'G') this.GPressed = false
            else if (event.key == 'h' || event.key == 'H') this.HPressed = false
            else if (event.key == 'i' || event.key == 'I') this.IPressed = false
            else if (event.key == 'j' || event.key == 'J') this.JPressed = false
            else if (event.key == 'k' || event.key == 'K') this.KPressed = false
            else if (event.key == 'l' || event.key == 'L') this.LPressed = false
            else if (event.key == 'm' || event.key == 'M') this.MPressed = false
            else if (event.key == 'n' || event.key == 'N') this.NPressed = false
            else if (event.key == 'o' || event.key == 'O') this.OPressed = false
            else if (event.key == 'p' || event.key == 'P') this.PPressed = false
            else if (event.key == 'q' || event.key == 'Q') this.QPressed = false
            else if (event.key == 'r' || event.key == 'R') this.RPressed = false
            else if (event.key == 's' || event.key == 'S') this.SPressed = false
            else if (event.key == 't' || event.key == 'T') this.TPressed = false
            else if (event.key == 'u' || event.key == 'U') this.UPressed = false
            else if (event.key == 'v' || event.key == 'V') this.VPressed = false
            else if (event.key == 'w' || event.key == 'W') this.WPressed = false
            else if (event.key == 'x' || event.key == 'X') this.XPressed = false
            else if (event.key == 'y' || event.key == 'Y') this.YPressed = false
            else if (event.key == 'z' || event.key == 'Z') this.ZPressed = false
            else if (event.key == 'ArrowLeft')  this.LeftArrowPressed  = false
            else if (event.key == 'ArrowRight') this.RightArrowPressed = false
            else if (event.key == 'ArrowUp')    this.UpArrowPressed    = false
            else if (event.key == 'ArrowDown')  this.DownArrowPressed  = false
            else if (event.key == 'Shift') this.ShiftPressed = false
            else if (event.key == ' ') this.SpacePressed = false
            else if (event.key == 'Backspace') this.BackspacePressed = false
        }

        if (event.metaKey) this.CmdPressed = false
    }

    startFrame()
    {
        const t = Date.now()
        this.d = (this.time == 0) ? 0.0 : t - this.time
        this.time = t

        if (this.d > 40)
        {
            this.d = 0
        }
    }

    endFrame()
    {
        if (this.leftMouseClicked)
        {
            this.leftMouseClicked = false
            this.leftMouseHeld = true
        }

        if (this.rightMouseClicked)
        {
            this.rightMouseClicked = false
            this.rightMouseHeld = true
        }

        if (this.CmdPressed)
        {
            // release all keys
            this.APressed = false;
            this.DPressed = false;
            this.WPressed = false;
            this.SPressed = false;
            this.QPressed = false;
            this.EPressed = false;
            this.FPressed = false;
            this.UPressed = false;
            this.CPressed = false;
            this.XPressed = false;
            this.ZPressed = false;
            this.LPressed = false;
            this.LeftArrowPressed = false;
            this.RightArrowPressed = false;
            this.UpArrowPressed = false;
            this.DownArrowPressed = false;
            this.ShiftPressed = false;
            this.SpacePressed = false;
            this.CmdPressed   = false;
            this.BackspacePressed = false;
        }


        this.mouseChangeX = 0
        this.mouseChangeY = 0
    }
}