const getCategoryId = (categoryName) => {
    switch (categoryName) {
        case "Engine Computer ECU":
            return 33596;
        case "Computer Chip (Other)":
            return 33598;
        case "Head Light":
            return 33710
        case "Tail Light":
            return 33716
        case "Climate Control":
            return 33545
        case "Interior Part (Other)":
            return 42612
        case "Exterior Mirror":
            return 33649
        case "Interior Mirror":
            return 33699
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
        case "Steering & Suspension Parts":
            return 42609
            case "Audio Amplifier":
            return 21647
        default:
            return ""
    }
}

export default getCategoryId;