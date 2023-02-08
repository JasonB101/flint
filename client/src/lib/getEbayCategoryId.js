const getCategoryId = (categoryName) => {
    switch (categoryName) {
        case "Engine Computer ECU":
            return 33596;
        case "Engine Coolant Components":
            return 46096;
        case "Computer Chip (Other)":
            return 33598;
        case "Cup Holders":
            return 63691;
        case "Console Lid":
            return 262189;
        case "Door Handles":
            return 179851;
        case "Head Light":
            return 33710
        case "Headrests":
            return 262200
        case "Tail Light":
            return 33716
        case "Climate Control":
            return 33545
        case "Interior Part (Other)":
            return 42612
        case "Exterior Mirror":
            return 33649
        case "Fuel Injection Parts Other":
            return 33553
        case "Interior Mirror":
            return 33699
        case "Intake Manifolds":
            return 36474
        case "Dash Parts":
            return 40017
        case "Switches":
            return 50459
        case "Exterior Moulding":
            return 33654
        case "Fuse Box":
            return 262221
        case "Wiper Motor/Transmissions Linkage":
            return 61941
        case "Window Motor":
            return 33706
        case "Radio":
            return 174119
        case "Steering & Suspension Parts":
            return 42609
        case "Sun Visors":
            return 46102
        case "Throttle Body":
            return 33558
        case "Power Steering Pump":
            return 33588
        case "Audio Amplifier":
            return 21647
        case "Valve Cover":
            return 33627
        default:
            return ""
    }
}

export default getCategoryId;