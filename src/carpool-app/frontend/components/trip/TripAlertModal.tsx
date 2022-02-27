import {Button, Modal, Text} from "native-base";

function TripAlertModal({headerText, bodyText, btnAction}) {
    return (
        <Modal isOpen={true}>
            <Modal.Content>
                <Modal.Header>
                    {headerText}
                </Modal.Header>
                <Modal.Body>
                    <Text>{bodyText}</Text>
                </Modal.Body>
                <Modal.Footer>
                    <Button onPress={() => {btnAction.action();}}>{btnAction.text}</Button>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    )
}

export default TripAlertModal;