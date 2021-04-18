import * as React from "react";
import { hot } from "react-hot-loader";
import "./App.scss";
import { activeAutonCreator, AutonCreator } from "./AutonManager";

export type IAppProps = {

}

export type IAppState = {
    open: boolean
    autonCreator: AutonCreator
}

class App extends React.Component<IAppProps, IAppState> {
    constructor(props: IAppProps) {
        super(props);
        this.state = { open: true, autonCreator: new AutonCreator() };
    }

    openNav() {
        if (!this.state.open) {
            document.getElementById("mySidenav").style.width = "300px";
            document.getElementById("sharedWaypointsBar").style.right = "300px";
            document.getElementById("sidebarText").innerHTML = "<i class=\"fas fa-chevron-right\"></i> Hide Sidebar <i class=\"fas fa-chevron-right\"></i>"
        } else {
            document.getElementById("mySidenav").style.width = "0";
            document.getElementById("sharedWaypointsBar").style.right = "0";
            document.getElementById("sidebarText").innerHTML = "<i class=\"fas fa-chevron-left\"></i> Expand Sidebar <i class=\"fas fa-chevron-left\"></i>"
        }

        this.setState({
            open: !this.state.open
        });
    }

    render() {
        return (
            <div>
                <nav className="navbar-vertical navbar-expand-sm bg-light p-0">
                    <form className="form-inline py-0">
                        <select name="pathSelector" className="custom-select" id="pathSelector"></select>
                        <button type="button" className="btn btn-success" onClick={this.state.autonCreator.createNewPath}>New Path</button>
                        <button type="button" className="btn btn-success" onClick={this.state.autonCreator.newWaypoint}>New Waypoint</button>
                        <button type="button" className="btn btn-success" onClick={this.state.autonCreator.newSharedWaypoint}>New Shared Waypoint</button>
                        <button type="button" className="btn btn-danger" onClick={this.state.autonCreator.removeWaypoint}>Remove Waypoint</button>
                        <button type="button" className="btn btn-primary" disabled={true} data-toggle="modal" data-target="#waypointSettingsModal" id="nameWaypointButton">Name Waypoint</button>
                        <button type="button" className="btn btn-primary" onClick={this.state.autonCreator.exportPath}>Export Path</button>
                        <button type="button" className="btn btn-primary" onClick={this.state.autonCreator.sendPath}>Send Path</button>
                        <button type="button" className="btn btn-danger" id="connect-to-robot-button" onClick={this.state.autonCreator.connectToRobot}>Connect to
                            Robot
                        </button>
                        <button type="button" className="btn btn-info ml-auto" data-toggle="modal" data-target="#myModal">
                            <i className="fas fa-cog"></i> Config
                        </button>
                    </form>
                </nav>
                <div className="d-flex" style={{flex: "1 1 auto"}}>
                    <form className="waypointInfo flex-column form-inline">
                        <div className="form-group mt-auto location-form">
                            <label className="location-label m-1" htmlFor="x-value">X:</label>
                            <input className="location-input m-1 rounded-lg" type="text" id="x-value" disabled />
                        </div>
                        <div className="form-group location-form mb-4">
                            <label className="location-label m-1" htmlFor="y-value">Y:</label>
                            <input className="location-input m-1 rounded-lg" type="text" id="y-value" disabled />
                        </div>
                    </form>

                    <div className="bg-light sidenav" id="mySidenav">
                        <a className="navbar-brand px-3">Shared Waypoints</a>
                        <div className="bg-light" id="waypointsList"></div>
                    </div>

                    <div className="sidebar d-flex align-self-center" id="sharedWaypointsBar" style={{transition: "0.5s", flex: "1 1 auto"}}>
                        <a onClick={this.openNav} id="sidebarText" style={{cursor: "pointer", writingMode: "vertical-rl", color: "white"}}>
                            <i className="fas fa-chevron-right"></i>
                            Hide Sidebar
                            <i className="fas fa-chevron-right"></i>
                        </a>
                    </div>

                    <div className="windowDivClass d-flex justify-content-center align-content-center" style={{flex: "1 1 auto"}}
                        id="windowDiv">
                        <canvas className="windowClass" id="windowCanvas"></canvas>
                    </div>
                </div>

                <div className="modal fade" id="myModal" role="dialog">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3 className="modal-title">Configuration Settings</h3>
                                <button className="close" data-dismiss="modal" type="button" onClick={this.state.autonCreator.loadConfig}>&times;</button>
                            </div>
                            <div className="modal-body">
                                <form className="form">
                                    <div className="form-group">
                                        <label htmlFor="robotName">Robot name:</label>
                                        <input className="form-control" id="robotName" type="text" />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="robotWidth">Robot width: (Inches)</label>
                                        <input className="form-control" id="robotWidth" type="number"/>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="robotLength">Robot length: (Inches)</label>
                                        <input className="form-control" id="robotLength" type="number"/>
                                    </div>
                                    <div className="form-group">
                                        <div>
                                            <label htmlFor="swerveTankToggle">Drive Mode:</label>
                                        </div>
                                        <button type="button" className="btn btn-primary" id="swerveTankToggle" onClick={this.state.autonCreator.setSwerve}>
                                            Tank Drive
                                        </button>
                                    </div>
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-default" data-dismiss="modal" type="button" onClick={this.state.autonCreator.loadConfig}>Close</button>
                                <button className="btn btn-primary" data-dismiss="modal" type="button" onClick={this.state.autonCreator.saveConfig}>Save</button>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="modal fade" id="waypointSettingsModal" role="dialog">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3 className="modal-title">Waypoint Settings</h3>
                                <button className="close" data-dismiss="modal" type="button">&times;</button>
                            </div>
                            <div className="modal-body">
                                <form className="form">
                                    <div className="form-group">
                                        <label htmlFor="waypointName">Waypoint name:</label>
                                        <input className="form-control" id="waypointName" type="text"/>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="waypointSpeed">Waypoint speed:</label>
                                        <input className="form-control" id="waypointSpeed" type="number"/>
                                    </div>
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-default" data-dismiss="modal" type="button">Close</button>
                                <button className="btn btn-primary" data-dismiss="modal" type="button" onClick={this.state.autonCreator.saveWaypointConfig}>Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default hot(module)(App);