import os
from twilio.rest import Client
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

class WhatsAppService:
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.sender = os.getenv("TWILIO_WHATSAPP_SENDER")
        
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
        else:
            self.client = None

    def send_tanker_dispatch(self, driver_name: str, driver_phone: str, village_name: str, route_link: str, quantity: int):
        """Send a WhatsApp notification to the tanker driver."""
        if not self.client:
            print("❌ Twilio client not configured.")
            return False

        # Format phone number for WhatsApp (needs whatsapp: prefix)
        to_number = f"whatsapp:{driver_phone}"
        
        message_body = (
            f"💧 *JALMITRA EMERGENCY DISPATCH* 🚀\n\n"
            f"Hello *{driver_name}*,\n"
            f"You have been assigned an urgent water delivery.\n\n"
            f"📍 *Village*: {village_name}\n"
            f"📦 *Quantity*: {quantity} Liters\n"
            f"🗓️ *Priority*: EMERGENCY\n\n"
            f"🗺️ *Open Navigation*: {route_link}\n\n"
            f"Please confirm once you start the trip. Safe travels!"
        )

        try:
            message = self.client.messages.create(
                from_=self.sender,
                body=message_body,
                to=to_number
            )
            print(f"✅ WhatsApp message sent! SID: {message.sid}")
            return True
        except Exception as e:
            print(f"❌ Failed to send WhatsApp: {str(e)}")
            return False

    def generate_google_maps_link(self, depot: Dict, stops: List[Dict]) -> str:
        """Create a Google Maps multi-stop navigation link."""
        # Base URL for directions
        base_url = "https://www.google.com/maps/dir/?api=1"
        origin = f"{depot['lat']},{depot['lng']}"
        
        # Stop coordinates
        destination = f"{stops[-1]['lat']},{stops[-1]['lng']}" if stops else origin
        
        waypoint_list = []
        if len(stops) > 1:
            for stop in stops[:-1]:
                waypoint_list.append(f"{stop['lat']},{stop['lng']}")
        
        waypoints = "|".join(waypoint_list)
        
        link = f"{base_url}&origin={origin}&destination={destination}"
        if waypoints:
            link += f"&waypoints={waypoints}"
            
        return link

whatsapp_service = WhatsAppService()
