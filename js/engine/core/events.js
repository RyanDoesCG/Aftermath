const EVENT_TYPE_OBJECT_SELECTION   = 0
const EVENT_TYPE_OBJECT_DESELECTION = 1

function getEventTypeString(e)
{
    if (e == EVENT_TYPE_OBJECT_SELECTION) return "Object Selected"
    if (e == EVENT_TYPE_OBJECT_DESELECTION) return "Object Deselected"

    return ""
}

class Event
{
    constructor(object, type)
    {
        this.objectID = object;
        this.typeID = type;
    }
}

class EventQueue
{
    constructor(engine)
    {
        this.engine = engine
        this.events = []
    }

    add (event)
    {
        this.events.push(event)
    }

    addUnique (event)
    {
        for (var i = 0; i < this.events.length; ++i)
        {
            if (this.events[i].typeID == event.typeID)
            {
                this.events[i] = event
                return;
            }
        }

        this.add(event)
    }

    remove (type)
    {
        for (var i = 0; i < this.events.length; ++i)
        {
            if (this.events[i].typeID == type)
            {
                this.events.splice(i, 1)
            }
        }
    }

    clear ()
    {
        this.events = []
    }

    findType (type)
    {
        for (var i = this.events.length - 1; i >= 0; --i)
        {
            if (this.events[i].typeID == type)
            {
                return this.events[i]
            }
        }
        return null
    }
}