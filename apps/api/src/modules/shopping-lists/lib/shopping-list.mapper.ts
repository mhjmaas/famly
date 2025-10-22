import type {
  ShoppingList,
  ShoppingListDTO,
  ShoppingListItem,
  ShoppingListItemDTO,
} from "../domain/shopping-list";

export function toShoppingListItemDTO(
  item: ShoppingListItem,
): ShoppingListItemDTO {
  return {
    _id: item._id.toString(),
    name: item.name,
    checked: item.checked,
    createdAt: item.createdAt.toISOString(),
  };
}

export function toShoppingListDTO(list: ShoppingList): ShoppingListDTO {
  return {
    _id: list._id.toString(),
    familyId: list.familyId.toString(),
    name: list.name,
    tags: list.tags,
    items: list.items.map(toShoppingListItemDTO),
    createdBy: list.createdBy.toString(),
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
  };
}
