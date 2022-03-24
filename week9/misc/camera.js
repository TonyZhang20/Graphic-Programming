function Camera(input) {
    // The following two parameters will be used to automatically create the cameraWorldMatrix in this.update()
    this.cameraYaw = 0;

    this.cameraPosition = new Vector3();
    this.cameraWorldMatrix = new Matrix4();

    // -------------------------------------------------------------------------
    this.getViewMatrix = function() {
        return this.cameraWorldMatrix.clone().inverse();
    }

    // -------------------------------------------------------------------------
    this.getForward = function() {
        // todo #6 - pull out the forward direction from the world matrix and return as a vector
        //         - recall that the camera looks in the "backwards" direction
        var Inverse = this.getViewMatrix();
        var vector3 = new Vector3(Inverse.elements[2],Inverse.elements[6],-Inverse.elements[10]).normalize();
        return vector3;
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
        this.cameraWorldMatrix.multiply(RotationY);
        // (order matters!)
    }
}

// EOF 00100001-10