from fastapi import APIRouter
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.vehicles import router as vehicles_router
from app.api.v1.endpoints.customers import router as customers_router
from app.api.v1.endpoints.orders import router as orders_router
from app.api.v1.endpoints.quote import router as quote_router
from app.api.v1.endpoints.inventory import router as inventory_router
from app.api.v1.endpoints.order_parts import router as order_parts_router
from app.api.v1.endpoints.inventory_movements import router as inventory_movements_router   
from app.api.v1.endpoints.billing import router as billing_router





api_router = APIRouter(prefix="/api")
api_router.include_router(users_router)
api_router.include_router(vehicles_router)
api_router.include_router(customers_router)
api_router.include_router(orders_router)
api_router.include_router(quote_router)
api_router.include_router(inventory_router)
api_router.include_router(order_parts_router)
api_router.include_router(inventory_movements_router)
api_router.include_router(billing_router)
    
