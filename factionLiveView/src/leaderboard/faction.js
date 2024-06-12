import React, { forwardRef } from "react";

// export class Faction extends React.Component {

//     render() {
//         return (
            
//             <div className={`faction-box-${this.props.layout}`} id={this.props.name}>
//                 <div><img src={`/imgs/${this.props.name}.png`} className='faction-img'></img></div>
//                 <span className='faction-total'>{this.props.total}</span>
//             </div>
//         )
//     }
// }

const Faction = React.forwardRef(({ name, total, layout }, ref) => (
    <div className={`faction-box-${layout}`} id={name} ref={ref}>
        <div><img src={`/imgs/${name}.png`} className='faction-img'></img></div>
        <span className='faction-total'>{total}</span>
    </div>
));

export default Faction;