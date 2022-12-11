// TODO the enums, types and interfaces could be in 
// their own library package so that they can be
// imported by a frontend or backend implementation
//
// Leave them here for now.

// Noticed that gender is a 1 or 2 value in the CSVs.
enum AssignedGender {
  Female = `1`,
  Male = `2`
}

// Making some of these optional
interface Patient {
  agemos: string
  sex: AssignedGender
  head_circumference: number
  weight?: number
  height?: number
  bmi?: number
}

type Attribute = 'height' | 'weight' | 'head_circumference' | 'bmi';

export { Patient, Attribute }

// FYI
// DynamoDb response looks like:
// {
//     "Item": {
//         "P3": {
//             "N": "35.78126227"
//         },
//         "Sex": {
//             "S": "1"
//         },
//         "P5": {
//             "N": "36.26427603"
//         },
//         "P90": {
//             "N": "41.12605049"
//         },
//         "P95": {
//             "N": "41.62581415"
//         },
//         "P50": {
//             "N": "39.20742929"
//         },
//         "L": {
//             "N": "3.869576802"
//         },
//         "M": {
//             "N": "39.20742929"
//         },
//         "P75": {
//             "N": "40.2498675"
//         },
//         "P97": {
//             "N": "41.94137873"
//         },
//         "P10": {
//             "N": "36.97376845"
//         },
//         "S": {
//             "N": "0.040947903"
//         },
//         "P25": {
//             "N": "38.07877607"
//         },
//         "Agemos": {
//             "S": "1.5"
//         }
//     }
// }

