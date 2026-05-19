#include "FileAnalyzer.hpp"
#include <algorithm>
#include <cctype>

namespace cba {

FileAnalyzer::FileAnalyzer(std::filesystem::path filePath)
    : filePath_(std::move(filePath)) {
    fileName_ = filePath_.filename().string();
    std::error_code ec;
    fileSize_ = std::filesystem::file_size(filePath_, ec);
    if (ec) {
        fileSize_ = 0;
    }
}

bool FileAnalyzer::isBlank(const std::string& line) noexcept {
    return std::all_of(line.begin(), line.end(), [](unsigned char c) {
        return std::isspace(c);
    });
}

void FileAnalyzer::trim(std::string& s) noexcept {
    auto start = std::find_if_not(s.begin(), s.end(), [](unsigned char c) { return std::isspace(c); });
    auto end = std::find_if_not(s.rbegin(), s.rend(), [](unsigned char c) { return std::isspace(c); }).base();
    if (start < end) {
        s = std::string(start, end);
    } else {
        s.clear();
    }
}

} // namespace cba
