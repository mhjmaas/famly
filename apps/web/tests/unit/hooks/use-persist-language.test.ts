import { act, renderHook } from "@testing-library/react";
import { usePersistLanguage } from "@/hooks/use-persist-language";
import { setUser } from "@/store/slices/user.slice";

jest.mock("@/lib/api-client", () => ({
  updateProfile: jest.fn(),
}));

jest.mock("@/store/hooks", () => ({
  useAppDispatch: jest.fn(),
}));

const mockUpdateProfile = jest.requireMock("@/lib/api-client")
  .updateProfile as jest.Mock;
const mockUseAppDispatch = jest.requireMock("@/store/hooks")
  .useAppDispatch as jest.Mock;

describe("usePersistLanguage", () => {
  beforeEach(() => {
    mockUpdateProfile.mockReset();
    mockUseAppDispatch.mockReset();
  });

  it("calls updateProfile and dispatches setUser when successful", async () => {
    const dispatch = jest.fn();
    mockUseAppDispatch.mockReturnValue(dispatch);
    const mockUser = { id: "1", email: "test@example.com" };
    mockUpdateProfile.mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => usePersistLanguage());

    await act(async () => {
      await result.current("nl-NL");
    });

    expect(mockUpdateProfile).toHaveBeenCalledWith({ language: "nl-NL" });
    expect(dispatch).toHaveBeenCalledWith(setUser(mockUser as never));
  });

  it("swallows errors to avoid blocking navigation", async () => {
    const dispatch = jest.fn();
    mockUseAppDispatch.mockReturnValue(dispatch);
    mockUpdateProfile.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => usePersistLanguage());

    await act(async () => {
      await result.current("nl-NL");
    });

    expect(dispatch).not.toHaveBeenCalled();
  });
});
