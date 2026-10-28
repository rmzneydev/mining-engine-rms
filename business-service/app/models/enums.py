from enum import Enum


class RepairOrderStatus(str, Enum):
    RECEIVED = "received"
    DIAGNOSING = "diagnosing"
    WAITING_APPROVAL = "waiting_approval"
    REPAIRING = "repairing"
    TESTING = "testing"
    FINISHED = "finished"
    DELIVERED = "delivered"
