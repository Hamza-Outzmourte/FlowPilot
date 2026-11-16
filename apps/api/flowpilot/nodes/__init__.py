# Import all node modules to trigger @register_node registration
from flowpilot.nodes.triggers import telegramTrigger  # noqa: F401
from flowpilot.nodes.triggers import chatTrigger  # noqa: F401
from flowpilot.nodes.actions import telegramSendMessage  # noqa: F401
from flowpilot.nodes.actions import gmailSend  # noqa: F401
from flowpilot.nodes.ai import aiAgent  # noqa: F401
from flowpilot.nodes.flow import ifNode  # noqa: F401