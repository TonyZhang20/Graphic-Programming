function Camera(input) {
    // The following two parameters will be used to automatically create the cameraWorldMatrix in this.update()
    this.cameraYaw = 0;

    this.cameraPosition = new Vector3();
    this.cameraWorldMatrix = new Matrix4();

    this.eye = new Vector3(0,0,1);


    // -------------------------------------------------------------------------
    this.getViewMatrix = function() {
        return this.cameraWorldMatrix.clone().inverse();
    }

    // -------------------------------------------------------------------------
    this.getForward = function() {
        // todo #6 - pull out the forward direction from the world matrix and return as a vector
        //         - recall that the camera looks in the "backwards" direction

        var Inverse = this.getViewMatrix();
        this.LocalForward = new Vector3(Inverse.elements[2],Inverse.elements[6],-Inverse.elements[10]).normalize();

        var Result = new Vector3(this.cameraWorldMatrix.elements[3], this.cameraWorldMatrix.elements[7], this.cameraWorldMatrix.elements[11]);
        var SecondR = new Vector3(this.cameraWorldMatrix.elements[3], this.cameraWorldMatrix.elements[7], this.cameraWorldMatrix.elements[11] -1);
        this.WorldForward = SecondR.subtract(Result)
        return this.WorldForward;
    }
    // -------------------------------------------------------------------------
    this.update = function(dt) {

        var currentForward = this.getForward();
        if (input.up) {
            // todo #7 - move the camera position a little bit in its forward direction
            //this.cameraPosition = new Vector3(this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z - currentForward.z);
            this.cameraPosition.add(currentForward.multiplyScalar(0.1));
        }

        if (input.down) {
            // todo #7 - move the camera position a little bit in its backward direction
            //this.cameraPosition = new Vector3(this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z + currentForward.z);
            this.cameraPosition.subtract(currentForward.multiplyScalar(0.1));
        }

        if (input.left) {
            // todo #8 - add a little bit to the current camera yaw
            this.cameraYaw = this.cameraYaw + 0.8;
        }

        if (input.right) {
            // todo #8 - subtract a little bit from the current camera yaw
            this.cameraYaw = this.cameraYaw - 0.8;
        }

        // todo #7 - create the cameraWorldMatrix from scratch based on this.cameraPosition
        this.cameraWorldMatrix.makeTranslation(this.cameraPosition);

        // todo #8 - create a rotation matrix based on cameraYaw and apply it to the cameraWorldMatrix
        var RotationY = new Matrix4().makeRotationY(this.cameraYaw);

        // var tempEyePosition = new Vector3(this.eye.x, this.eye.y, this.eye.clone().z - Math.tan(this.cameraYaw * Math.PI / 180) * currentForward.length()); 
        // this.secondVector = tempEyePosition.clone().subtract(this.eye.clone())
        // this.eye.add(this.secondVector)
        // console.log(this.secondVector)

        this.cameraWorldMatrix.multiply(RotationY);
        // (order matters!)
    }
}

// EOF 00100001-10
